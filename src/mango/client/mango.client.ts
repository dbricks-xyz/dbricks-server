import {Cluster, createAccountInstruction, getTokenAccountsByOwnerWithWrappedSol, IDS, makeDepositInstruction, makeInitMangoAccountInstruction, makeWithdrawInstruction, MangoAccount, MangoAccountLayout, MangoClient as NativeMangoClient, MangoGroup, uiToNative,} from '@blockworks-foundation/mango-client';
import {closeAccount, initializeAccount, WRAPPED_SOL_MINT,} from '@project-serum/serum/lib/token-instructions';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID,} from '@solana/spl-token';
import {Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram, TransactionInstruction,} from '@solana/web3.js';
import debug from 'debug';
import SolClient from '../../common/client/common.client';
import {ixsAndSigners} from '../../common/interfaces/dex/common.interfaces.dex.order';
import {MANGO_PROG_ID, NETWORK} from '../../config/config';

const log: debug.IDebugger = debug('app:mango-client');

export type MangoInformation = {
  userAccs: MangoAccount[];
  tokenAccPk: PublicKey;
  rootBank: PublicKey;
  nodeBank: PublicKey;
  vault: PublicKey;
};

export default class MangoClient extends SolClient {
  nativeClient: NativeMangoClient;

  group!: MangoGroup;

  groupName: string;

  cluster: Cluster;

  constructor() {
    super();
    this.nativeClient = new NativeMangoClient(this.connection, MANGO_PROG_ID);
    if (NETWORK === 'mainnet') {
      this.groupName = 'mainnet.1';
      this.cluster = 'mainnet';
    } else {
      this.groupName = 'devnet.2';
      this.cluster = 'devnet';
    }
    log('Initialized Mango client');
  }

  async loadGroup() {
    const groupPk = IDS.groups.find(
      (group) => group.name === this.groupName,
    )?.publicKey;
    if (!groupPk) {
      throw new Error('Error initializing Mango client');
    }
    const mangoGroup = await this.nativeClient.getMangoGroup(
      new PublicKey(groupPk),
    );
    await mangoGroup.loadRootBanks(this.connection);
    await Promise.all(
      mangoGroup.rootBankAccounts.map((rootBank) => rootBank?.loadNodeBanks(this.connection)),
    ); // load each nodeBank for all rootBanks
    this.group = mangoGroup;
  }

  async loadUserAccounts(ownerPk: PublicKey) {
    if (!this.group) {
      await this.loadGroup();
    }
    try {
      return this.nativeClient.getMangoAccountsForOwner(
        this.group,
        ownerPk,
        true,
      );
    } catch (err) {
      log('Could not load Mango margin accounts', err);
      return [];
    }
  }

  async loadAllAccounts(
    ownerPk: PublicKey,
    mintPk: PublicKey,
  ): Promise<MangoInformation> {
    if (!this.group) {
      await this.loadGroup();
    }
    const tokenAccs = await getTokenAccountsByOwnerWithWrappedSol(
      this.connection,
      ownerPk,
    );
    const tokenAccount = tokenAccs.find(
      (acc) => acc.mint.toBase58() === mintPk.toBase58(),
    );
    if (!tokenAccount) {
      throw new Error(`Error loading ${mintPk} token account`);
    }

    const accounts = await this.loadUserAccounts(ownerPk);
    const tokenIndex = this.group.getTokenIndex(tokenAccount.mint);
    const { rootBank } = this.group.tokens[tokenIndex];
    const nodeBank = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;

    if (!rootBank || !nodeBank || !vault) {
      throw new Error('Error loading Mango vault accounts');
    }

    return {
      userAccs: accounts,
      tokenAccPk: tokenAccount.publicKey,
      rootBank,
      nodeBank,
      vault,
    };
  }

  // async loadSpotMarkets() {
  //   const mangoGroupConfig = Config.ids().getGroup(
  //     this.cluster,
  //     this.groupName,
  //   );
  //   if (!mangoGroupConfig) {
  //     log('Error loading Mango Group Configuration');
  //     return [];
  //   }
  //   const allMarketConfigs = getAllMarkets(mangoGroupConfig);
  //   const allMarketPks = allMarketConfigs.map((m) => m.publicKey);

  //   let allMarketAccountInfos: { accountInfo: { data: any; }; }[];
  //   try {
  //     const resp = await Promise.all([
  //       getMultipleAccounts(this.connection, allMarketPks),
  //       this.group.loadCache(this.connection),
  //       this.group.loadRootBanks(this.connection),
  //     ]);
  //     allMarketAccountInfos = resp[0];
  //   } catch {
  //     log('Failed to load markets');
  //     return [];
  //   }

  //   const spotMarkets = allMarketConfigs.filter((config) => config.kind == 'spot').map((config, i) => {
  //     const decoded = Market.getLayout(MANGO_PROG_ID).decode(
  //       allMarketAccountInfos[i].accountInfo.data,
  //     );
  //     return new Market(
  //       decoded,
  //       config.baseDecimals,
  //       config.quoteDecimals,
  //       undefined,
  //       mangoGroupConfig.serumProgramId,
  //     );
  //   });
  //   return spotMarkets;
  // }
  async addWrappedSolCreateAccountIx(
    transactionIxs: TransactionInstruction[],
    additionalSigners: Signer[],
    ownerPk: PublicKey,
    quantity?: number,
  ): Promise<Keypair> {
    const wrappedSolAccount = new Keypair();
    let lamports: number;
    if (quantity) {
      // depositTxn
      lamports = Math.round(quantity * LAMPORTS_PER_SOL) + 1e7;
    } else {
      // withdrawTxn
      lamports = await this.connection.getMinimumBalanceForRentExemption(
        165,
        'singleGossip',
      );
    }
    transactionIxs.push(
      SystemProgram.createAccount({
        fromPubkey: ownerPk,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports,
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
    );

    transactionIxs.push(
      initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: ownerPk,
      }),
    );

    additionalSigners.push(wrappedSolAccount);

    return wrappedSolAccount;
  }

  addWrappedSolCloseAccountIx(
    transactionIxs: TransactionInstruction[],
    ownerPk: PublicKey,
    wrappedSolAccount: Keypair,
  ) {
    transactionIxs.push(
      closeAccount({
        source: wrappedSolAccount.publicKey,
        destination: ownerPk,
        owner: ownerPk,
      }),
    );
  }

  async prepDepositTx(
    ownerPk: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,
    tokenAcc: PublicKey,
    quantity: number,
    mangoPk?: PublicKey,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];
    const additionalSigners: Signer[] = [];
    const tokenIndex = this.group.getRootBankIndex(rootBank);
    const tokenMint = this.group.tokens[tokenIndex].mint;

    let destinationPk: PublicKey;
    if (!mangoPk) { // Init Mango Account before deposit
      const accountInstruction = await createAccountInstruction(
        this.connection,
        ownerPk,
        MangoAccountLayout.span,
        MANGO_PROG_ID,
      );

      destinationPk = accountInstruction.account.publicKey;

      const initMangoAccountInstruction = makeInitMangoAccountInstruction(
        MANGO_PROG_ID,
        this.group.publicKey,
        destinationPk,
        ownerPk,
      );

      transactionIxs.push(accountInstruction.instruction);
      transactionIxs.push(initMangoAccountInstruction);

      const accountInstructionKeypair = Keypair.fromSecretKey(
        new Uint8Array(accountInstruction.account.secretKey),
      );
      additionalSigners.push(accountInstructionKeypair);
    } else {
      destinationPk = mangoPk;
    }

    let wrappedSolAccount: Keypair | null = null;
    if (
      tokenMint.equals(WRAPPED_SOL_MINT)
      && tokenAcc.toBase58() === ownerPk.toBase58()
    ) {
      wrappedSolAccount = await this.addWrappedSolCreateAccountIx(
        transactionIxs,
        additionalSigners,
        ownerPk,
        quantity,
      );
    }

    const nativeQuantity = uiToNative(
      quantity,
      this.group.tokens[tokenIndex].decimals,
    );

    const instruction = makeDepositInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      ownerPk,
      this.group.mangoCache,
      destinationPk,
      rootBank,
      nodeBank,
      vault,
      wrappedSolAccount ? wrappedSolAccount.publicKey : tokenAcc,
      nativeQuantity,
    );

    transactionIxs.push(instruction);

    if (wrappedSolAccount) {
      this.addWrappedSolCloseAccountIx(
        transactionIxs,
        ownerPk,
        wrappedSolAccount,
      );
    }

    return [transactionIxs, additionalSigners];
  }

  async prepWithdrawTx(
    mangoAccount: MangoAccount,
    ownerPk: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,

    quantity: number,
    allowBorrow: boolean,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];
    const additionalSigners: Signer[] = [];
    const tokenIndex = this.group.getRootBankIndex(rootBank);
    const tokenMint = this.group.tokens[tokenIndex].mint;

    let tokenAcc = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      ownerPk,
    );

    let wrappedSolAccount: Keypair | null = null;
    if (tokenMint.equals(WRAPPED_SOL_MINT)) {
      wrappedSolAccount = await this.addWrappedSolCreateAccountIx(
        transactionIxs,
        additionalSigners,
        ownerPk,
      );
      tokenAcc = wrappedSolAccount.publicKey;
    } else {
      const tokenAccExists = await this.connection.getAccountInfo(
        tokenAcc,
        'recent',
      );
      if (!tokenAccExists) {
        transactionIxs.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenMint,
            tokenAcc,
            ownerPk,
            ownerPk,
          ),
        );
      }
    }

    const nativeQuantity = uiToNative(
      quantity,
      this.group.tokens[tokenIndex].decimals,
    );

    const instruction = makeWithdrawInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      mangoAccount.publicKey,
      ownerPk,
      this.group.mangoCache,
      rootBank,
      nodeBank,
      vault,
      tokenAcc,
      this.group.signerKey,
      mangoAccount.spotOpenOrders,
      nativeQuantity,
      allowBorrow,
    );
    transactionIxs.push(instruction);

    if (wrappedSolAccount) {
      this.addWrappedSolCloseAccountIx(
        transactionIxs,
        ownerPk,
        wrappedSolAccount,
      );
    }

    return [transactionIxs, additionalSigners];
  }

  // async prepSettleSpotTx(
  //   mangoGroup: MangoGroup,
  //   mangoAccount: MangoAccount,
  //   spotMarkets: Market[],
  //   ownerPk: PublicKey,
  // ): Promise<ixsAndSigners> {
  // const transactionIxs: TransactionInstruction[] = [];

  //   for (let i = 0; i < spotMarkets.length; i += 1) {
  //     const openOrdersAccount = mangoAccount.spotOpenOrdersAccounts[i];
  //     if (openOrdersAccount === undefined) {
  //       continue;
  //     } else if (
  //       openOrdersAccount.quoteTokenFree.toNumber()
  //         + openOrdersAccount['referrerRebatesAccrued'].toNumber()
  //         === 0 &&
  //       openOrdersAccount.baseTokenFree.toNumber() === 0
  //     ) {
  //       continue;
  //     }

  //     const spotMarket = spotMarkets[i];
  //     const dexSigner = await PublicKey.createProgramAddress(
  //       [
  //         spotMarket.publicKey.toBuffer(),
  //         spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
  //       ],
  //       spotMarket.programId,
  //     );

  //     if (!mangoGroup.rootBankAccounts.length) {
  //       await mangoGroup.loadRootBanks(this.connection);
  //     }
  //     const baseRootBank = mangoGroup.rootBankAccounts[i];
  //     const quoteRootBank = mangoGroup.rootBankAccounts[QUOTE_INDEX];
  //     const baseNodeBank = baseRootBank?.nodeBankAccounts[0];
  //     const quoteNodeBank = quoteRootBank?.nodeBankAccounts[0];

  //     if (!baseNodeBank || !quoteNodeBank) {
  //       throw new Error('Invalid or missing node banks');
  //     }

  //     const instruction = makeSettleFundsInstruction(
  //       MANGO_PROG_ID,
  //       mangoGroup.publicKey,
  //       mangoGroup.mangoCache,
  //       ownerPk,
  //       mangoAccount.publicKey,
  //       spotMarket.programId,
  //       spotMarket.publicKey,
  //       mangoAccount.spotOpenOrders[i],
  //       mangoGroup.signerKey,
  //       spotMarket['_decoded'].baseVault,
  //       spotMarket['_decoded'].quoteVault,
  //       mangoGroup.tokens[i].rootBank,
  //       baseNodeBank.publicKey,
  //       mangoGroup.tokens[QUOTE_INDEX].rootBank,
  //       quoteNodeBank.publicKey,
  //       baseNodeBank.vault,
  //       quoteNodeBank.vault,
  //       dexSigner,
  //     );

  //     transactionIxs.push(instruction);
  //   }

  //   return [transactionIxs, []];
  // }
}
