import {
  createAccountInstruction,
  getTokenAccountsByOwnerWithWrappedSol,
  IDS,
  makeDepositInstruction,
  makeInitMangoAccountInstruction,
  makeWithdrawInstruction,
  MangoAccount,
  MangoAccountLayout,
  MangoClient as NativeMangoClient,
  MangoGroup,
  uiToNative,
} from '@blockworks-foundation/mango-client';
import {
  WRAPPED_SOL_MINT,
  initializeAccount,
  closeAccount,
} from '@project-serum/serum/lib/token-instructions';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import debug from 'debug';
import SolClient from '../../common/client/common.client';
import { ixsAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import { MANGO_PROG_ID } from '../../config/config';
import { getMint } from '../../config/config.util';

const log: debug.IDebugger = debug('app:mango-client');

export type MangoInformation = {
  userAccounts: MangoAccount[];
  tokenAccPk: PublicKey;
  rootBank: PublicKey;
  nodeBank: PublicKey;
  vault: PublicKey;
};

export class MangoClient extends SolClient {
  nativeClient: NativeMangoClient;

  group!: MangoGroup;

  constructor() {
    super();
    this.nativeClient = new NativeMangoClient(this.connection, MANGO_PROG_ID);
    log('Initialized Mango client');
  }

  async loadGroup() {
    const MANGO_GROUP_NAME = process.env.NETWORK === 'mainnet' ? 'mainnet.1' : 'devnet.2';
    const mangoGroupIds = IDS.groups.find(
      (group) => group.name === MANGO_GROUP_NAME,
    );
    if (!mangoGroupIds) {
      log('Failed to connect to Mango');
      return;
    }
    const mangoGroup = await this.nativeClient.getMangoGroup(
      new PublicKey(mangoGroupIds.publicKey),
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
      return await this.nativeClient.getMangoAccountsForOwner(
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
    token: string,
  ): Promise<MangoInformation | undefined> {
    if (!this.group) {
      await this.loadGroup();
    }
    const tokenAccounts = await getTokenAccountsByOwnerWithWrappedSol(this.connection, ownerPk);
    console.log(tokenAccounts.map((o) => o.mint.toBase58()));
    const mintAddress = getMint(token);
    console.log(mintAddress.toBase58());
    const tokenAccount = tokenAccounts.find(
      (acc) => acc.mint.toBase58() === mintAddress.toBase58(),
    );
    if (!tokenAccount) {
      log(`Error loading ${token} token account`);
      return;
    }

    const accounts = await this.loadUserAccounts(ownerPk);
    const tokenIndex = this.group.getTokenIndex(tokenAccount.mint);
    const { rootBank } = this.group.tokens[tokenIndex];
    const nodeBank = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;

    if (!rootBank || !nodeBank || !vault) {
      log('Error loading Mango vault accounts');
      return;
    }

    return {
      userAccounts: accounts,
      tokenAccPk: tokenAccount.publicKey,
      rootBank,
      nodeBank,
      vault,
    };
  }

  async prepDepositTx(
    mangoAccount: MangoAccount,
    ownerPk: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,
    tokenAcc: PublicKey,
    quantity: number,
  ): Promise<ixsAndSigners> {
    const transactionIx = [];
    const additionalSigners: Array<Keypair> = [];
    const tokenIndex = this.group.getRootBankIndex(rootBank);
    const tokenMint = this.group.tokens[tokenIndex].mint;

    let wrappedSolAccount: Keypair | null = null;
    if (
      tokenMint.equals(WRAPPED_SOL_MINT)
      && tokenAcc.toBase58() === ownerPk.toBase58()
    ) {
      wrappedSolAccount = new Keypair();
      const lamports = Math.round(quantity * LAMPORTS_PER_SOL) + 1e7;
      transactionIx.push(
        SystemProgram.createAccount({
          fromPubkey: ownerPk,
          newAccountPubkey: wrappedSolAccount.publicKey,
          lamports,
          space: 165,
          programId: TOKEN_PROGRAM_ID,
        }),
      );

      transactionIx.push(
        initializeAccount({
          account: wrappedSolAccount.publicKey,
          mint: WRAPPED_SOL_MINT,
          owner: ownerPk,
        }),
      );

      additionalSigners.push(wrappedSolAccount);
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
      mangoAccount.publicKey,
      rootBank,
      nodeBank,
      vault,
      wrappedSolAccount?.publicKey ?? tokenAcc,
      nativeQuantity,
    );

    transactionIx.push(instruction);

    if (wrappedSolAccount) {
      transactionIx.push(
        closeAccount({
          source: wrappedSolAccount.publicKey,
          destination: ownerPk,
          owner: ownerPk,
        }),
      );
    }

    return [transactionIx, additionalSigners];
  }

  async prepInitMangoAccountAndDepositTx(
    ownerPk: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,
    tokenAcc: PublicKey,
    quantity: number,
  ): Promise<ixsAndSigners> {
    const transactionIx = [];
    const accountInstruction = await createAccountInstruction(
      this.connection,
      ownerPk,
      MangoAccountLayout.span,
      MANGO_PROG_ID,
    );

    const initMangoAccountInstruction = makeInitMangoAccountInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      accountInstruction.account.publicKey,
      ownerPk,
    );

    transactionIx.push(accountInstruction.instruction);
    transactionIx.push(initMangoAccountInstruction);

    const accountInstructionKeypair = Keypair.fromSecretKey(
      new Uint8Array(accountInstruction.account.secretKey),
    );
    const additionalSigners = [accountInstructionKeypair];

    const tokenIndex = this.group.getRootBankIndex(rootBank);
    const tokenMint = this.group.tokens[tokenIndex].mint;

    let wrappedSolAccount: Keypair | null = null;
    if (
      tokenMint.equals(WRAPPED_SOL_MINT)
      && tokenAcc.toBase58() === ownerPk.toBase58()
    ) {
      wrappedSolAccount = new Keypair();
      const lamports = Math.round(quantity * LAMPORTS_PER_SOL) + 1e7;
      transactionIx.push(
        SystemProgram.createAccount({
          fromPubkey: ownerPk,
          newAccountPubkey: wrappedSolAccount.publicKey,
          lamports,
          space: 165,
          programId: TOKEN_PROGRAM_ID,
        }),
      );

      transactionIx.push(
        initializeAccount({
          account: wrappedSolAccount.publicKey,
          mint: WRAPPED_SOL_MINT,
          owner: ownerPk,
        }),
      );

      additionalSigners.push(wrappedSolAccount);
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
      accountInstruction.account.publicKey,
      rootBank,
      nodeBank,
      vault,
      wrappedSolAccount?.publicKey ?? tokenAcc,
      nativeQuantity,
    );

    transactionIx.push(instruction);

    if (wrappedSolAccount) {
      transactionIx.push(
        closeAccount({
          source: wrappedSolAccount.publicKey,
          destination: ownerPk,
          owner: ownerPk,
        }),
      );
    }
    return [transactionIx, additionalSigners];
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
    const transactionIx = [];
    const additionalSigners: Keypair[] = [];
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
      wrappedSolAccount = new Keypair();
      tokenAcc = wrappedSolAccount.publicKey;
      const space = 165;
      const lamports = await this.connection.getMinimumBalanceForRentExemption(
        space,
        'singleGossip',
      );
      transactionIx.push(
        SystemProgram.createAccount({
          fromPubkey: ownerPk,
          newAccountPubkey: tokenAcc,
          lamports,
          space,
          programId: TOKEN_PROGRAM_ID,
        }),
      );
      transactionIx.push(
        initializeAccount({
          account: tokenAcc,
          mint: WRAPPED_SOL_MINT,
          owner: ownerPk,
        }),
      );
      additionalSigners.push(wrappedSolAccount);
    } else {
      const tokenAccExists = await this.connection.getAccountInfo(
        tokenAcc,
        'recent',
      );
      if (!tokenAccExists) {
        transactionIx.push(
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
    transactionIx.push(instruction);

    if (wrappedSolAccount) {
      transactionIx.push(
        closeAccount({
          source: wrappedSolAccount.publicKey,
          destination: ownerPk,
          owner: ownerPk,
        }),
      );
    }

    return [transactionIx, additionalSigners];
  }
}

export default new MangoClient();
