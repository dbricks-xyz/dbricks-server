/* eslint-disable no-else-return */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable dot-notation */
import {Cluster, createAccountInstruction, getTokenAccountsByOwnerWithWrappedSol, getAllMarkets, getMultipleAccounts, IDS, Config, PerpMarketLayout, makeDepositInstruction, makeInitMangoAccountInstruction, makeWithdrawInstruction, makeSettleFundsInstruction, makePlaceSpotOrderInstruction, makeInitSpotOpenOrdersInstruction, makeCancelSpotOrderInstruction, makePlacePerpOrderInstruction, QUOTE_INDEX, MangoAccount, MangoAccountLayout, MangoClient as NativeMangoClient, MangoGroup, uiToNative, ZERO_BN, zeroKey, nativeToUi, PerpMarket, PerpMarketConfig, PerpOrder, makeCancelPerpOrderInstruction, I80F48, makeSettleFeesInstruction, makeSettlePnlInstruction, MangoCache, RootBank, WalletAdapter, ZERO_I80F48} from '@blockworks-foundation/mango-client';
import {closeAccount, initializeAccount, WRAPPED_SOL_MINT,} from '@project-serum/serum/lib/token-instructions';
import {getFeeRates, getFeeTier, Market, OpenOrders,} from '@project-serum/serum';
import {Order,} from '@project-serum/serum/lib/market';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID,} from '@solana/spl-token';
import {Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram, TransactionInstruction,} from '@solana/web3.js';
import debug from 'debug';
import { ixsAndSigners, side, orderType } from 'dbricks-lib';
import BN from 'bn.js';
import SolClient from '../../common/client/common.client';
import {COMMITTMENT, MANGO_PROG_ID, NETWORK, SERUM_PROG_ID} from '../../config/config';

const log: debug.IDebugger = debug('app:mango-client');

export type BankVaultInformation = {
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
      throw new Error('Error finding Mango group');
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

  async loadBankVaultInformation(
    mintPk: PublicKey,
  ): Promise<BankVaultInformation> {
    if (!this.group) {
      await this.loadGroup();
    }
    const tokenIndex = this.group.getTokenIndex(mintPk);
    const { rootBank } = this.group.tokens[tokenIndex];
    const nodeBank = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;
    if (!rootBank || !nodeBank || !vault) {
      throw new Error('Error loading Mango vault accounts');
    }

    return {
      rootBank,
      nodeBank,
      vault,
    };
  }

  async loadTokenAccount(ownerPk: PublicKey, mintPk: PublicKey) {
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
    return tokenAccount;
  }

  async getAllMarketInfos() {
    if (!this.group) {
      await this.loadGroup();
    }
    const mangoGroupConfig = this.getMangoGroupConfig();
    const allMarketConfigs = getAllMarkets(mangoGroupConfig);
    const allMarketPks = allMarketConfigs.map((m) => m.publicKey);

    let allMarketAccountInfos: { accountInfo: { data: any; }; }[];
    try {
      const resp = await Promise.all([
        getMultipleAccounts(this.connection, allMarketPks),
        this.group.loadCache(this.connection),
        this.group.loadRootBanks(this.connection),
      ]);
      allMarketAccountInfos = resp[0];
    } catch {
      throw new Error('Failed to load markets');
    }
    return { allMarketConfigs, allMarketAccountInfos, mangoGroupConfig };
  }

  async loadSpotMarkets() {
    const allmarketInfo = await this.getAllMarketInfos();
    const { allMarketConfigs, allMarketAccountInfos, mangoGroupConfig } = allmarketInfo;
    const spotMarkets = allMarketConfigs.filter((config) => config.kind == 'spot').map((config, i) => {
      const decoded = Market.getLayout(MANGO_PROG_ID).decode(
        allMarketAccountInfos[i].accountInfo.data,
      );
      return new Market(
        decoded,
        config.baseDecimals,
        config.quoteDecimals,
        undefined,
        mangoGroupConfig.serumProgramId,
      );
    });
    return spotMarkets;
  }

  getMangoGroupConfig() {
    const mangoGroupConfig = Config.ids().getGroup(
      this.cluster,
      this.groupName,
    );
    if (!mangoGroupConfig) {
      throw new Error('Error loading Mango Group Configuration');
    }
    return mangoGroupConfig;
  }

  async loadSpotMarket(marketPk: PublicKey) {
    const mangoGroupConfig = this.getMangoGroupConfig();
    const spotMarketConfig = mangoGroupConfig.spotMarkets.find(
      (p) => p.publicKey.toBase58() === marketPk.toBase58(),
    );
    if (!spotMarketConfig) {
      throw new Error(`Could not find spot market ${marketPk.toBase58()}`);
    }
    return Market.load(
      this.connection,
      spotMarketConfig.publicKey,
      {
        skipPreflight: true,
        commitment: COMMITTMENT,
      },
      SERUM_PROG_ID,
    );
  }

  async loadPerpMarket(marketPk: PublicKey) {
    const mangoGroupConfig = this.getMangoGroupConfig();
    const perpMarketConfig = mangoGroupConfig.perpMarkets.find(
      (p) => p.publicKey.toBase58() === marketPk.toBase58(),
    );
    if (!perpMarketConfig) {
      throw new Error(`Could not find perp market ${marketPk.toBase58()}`);
    }
    return this.nativeClient.getPerpMarket(
      perpMarketConfig.publicKey,
      perpMarketConfig.baseDecimals,
      perpMarketConfig.quoteDecimals,
    );
  }

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
        COMMITTMENT,
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

  async addSpotSettleFundsIx(transactionIxs: TransactionInstruction[], mangoGroup: MangoGroup, mangoAcc: MangoAccount, spotMarket: Market, ownerPk: PublicKey) {
    const dexSigner = await PublicKey.createProgramAddress(
      [
        spotMarket.publicKey.toBuffer(),
        spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
      ],
      spotMarket.programId,
    );

    const marketIndex = mangoGroup.getSpotMarketIndex(spotMarket.publicKey);
    if (!mangoGroup.rootBankAccounts.length) {
      await mangoGroup.loadRootBanks(this.connection);
    }
    const baseRootBank = mangoGroup.rootBankAccounts[marketIndex];
    const quoteRootBank = mangoGroup.rootBankAccounts[QUOTE_INDEX];
    const baseNodeBank = baseRootBank?.nodeBankAccounts[0];
    const quoteNodeBank = quoteRootBank?.nodeBankAccounts[0];

    if (!baseNodeBank || !quoteNodeBank) {
      throw new Error('Invalid or missing node banks');
    }

    const instruction = makeSettleFundsInstruction(
      MANGO_PROG_ID,
      mangoGroup.publicKey,
      mangoGroup.mangoCache,
      ownerPk,
      mangoAcc.publicKey,
      spotMarket.programId,
      spotMarket.publicKey,
      mangoAcc.spotOpenOrders[marketIndex],
      mangoGroup.signerKey,
      spotMarket['_decoded'].baseVault,
      spotMarket['_decoded'].quoteVault,
      mangoGroup.tokens[marketIndex].rootBank,
      baseNodeBank.publicKey,
      mangoGroup.tokens[QUOTE_INDEX].rootBank,
      quoteNodeBank.publicKey,
      baseNodeBank.vault,
      quoteNodeBank.vault,
      dexSigner,
    );

    transactionIxs.push(instruction);
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

    return {ixs: transactionIxs, signers: additionalSigners};
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

    return {ixs: transactionIxs, signers: additionalSigners};
  }

  async prepPlaceSpotOrderTx(
    mangoGroup: MangoGroup,
    mangoAccount: MangoAccount,
    mangoCache: PublicKey,
    spotMarket: Market,
    ownerPk: PublicKey,
    side: side,
    price: number,
    size: number,
    orderType?: orderType,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];
    const additionalSigners: Signer[] = [];

    const limitPrice = spotMarket.priceNumberToLots(price);
    const maxBaseQuantity = spotMarket.baseSizeNumberToLots(size);

    const feeTier = getFeeTier(0, nativeToUi(0, 0));
    const rates = getFeeRates(feeTier);
    const maxQuoteQuantity = new BN(
      spotMarket['_decoded'].quoteLotSize.toNumber() * (1 + rates.taker),
    ).mul(
      spotMarket
        .baseSizeNumberToLots(size)
        .mul(spotMarket.priceNumberToLots(price)),
    );

    if (maxBaseQuantity.lte(ZERO_BN as BN)) {
      throw new Error('size too small');
    }
    if (limitPrice.lte(ZERO_BN as BN)) {
      throw new Error('invalid price');
    }
    const selfTradeBehavior = 'decrementTake';
    const clientId = new BN(Date.now());

    const spotMarketIndex = mangoGroup.getSpotMarketIndex(spotMarket.publicKey);

    if (!mangoGroup.rootBankAccounts.filter((a) => !!a).length) {
      await mangoGroup.loadRootBanks(this.connection);
    }

    const baseRootBank = mangoGroup.rootBankAccounts[spotMarketIndex];
    const baseNodeBank = baseRootBank?.nodeBankAccounts[0];
    const quoteRootBank = mangoGroup.rootBankAccounts[QUOTE_INDEX];
    const quoteNodeBank = quoteRootBank?.nodeBankAccounts[0];

    if (!baseRootBank || !baseNodeBank || !quoteRootBank || !quoteNodeBank) {
      throw new Error('Invalid or missing banks');
    }
    const openOrdersKeys: { pubkey: PublicKey; isWritable: boolean }[] = [];

    // Only pass in open orders if in margin basket or current market index, and
    // the only writable account should be OpenOrders for current market index
    for (let i = 0; i < mangoAccount.spotOpenOrders.length; i += 1) {
      let pubkey = zeroKey;
      let isWritable = false;

      if (i === spotMarketIndex) {
        isWritable = true;

        if (mangoAccount.spotOpenOrders[spotMarketIndex].equals(zeroKey)) {
          // open orders missing for this market; create a new one now
          const openOrdersSpace = OpenOrders.getLayout(
            mangoGroup.dexProgramId,
          ).span;

          const openOrdersLamports = await this.connection.getMinimumBalanceForRentExemption(
            openOrdersSpace,
            COMMITTMENT,
          );

          const accInstr = await createAccountInstruction(
            this.connection,
            ownerPk,
            openOrdersSpace,
            mangoGroup.dexProgramId,
            openOrdersLamports,
          );

          const initOpenOrders = makeInitSpotOpenOrdersInstruction(
            MANGO_PROG_ID,
            mangoGroup.publicKey,
            mangoAccount.publicKey,
            ownerPk,
            mangoGroup.dexProgramId,
            accInstr.account.publicKey,
            spotMarket.publicKey,
            mangoGroup.signerKey,
          );

          transactionIxs.push(accInstr.instruction);
          transactionIxs.push(initOpenOrders);
          additionalSigners.push(accInstr.account);

          pubkey = accInstr.account.publicKey;
        } else {
          pubkey = mangoAccount.spotOpenOrders[i];
        }
      } else if (mangoAccount.inMarginBasket[i]) {
        pubkey = mangoAccount.spotOpenOrders[i];
      }

      openOrdersKeys.push({ pubkey, isWritable });
    }

    const dexSigner = await PublicKey.createProgramAddress(
      [
        spotMarket.publicKey.toBuffer(),
        spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
      ],
      spotMarket.programId,
    );

    const placeOrderInstruction = makePlaceSpotOrderInstruction(
      MANGO_PROG_ID,
      mangoGroup.publicKey,
      mangoAccount.publicKey,
      ownerPk,
      mangoCache,
      spotMarket.programId,
      spotMarket.publicKey,
      spotMarket['_decoded'].bids,
      spotMarket['_decoded'].asks,
      spotMarket['_decoded'].requestQueue,
      spotMarket['_decoded'].eventQueue,
      spotMarket['_decoded'].baseVault,
      spotMarket['_decoded'].quoteVault,
      baseRootBank.publicKey,
      baseNodeBank.publicKey,
      baseNodeBank.vault,
      quoteRootBank.publicKey,
      quoteNodeBank.publicKey,
      quoteNodeBank.vault,
      mangoGroup.signerKey,
      dexSigner,
      mangoGroup.srmVault,
      openOrdersKeys,
      side,
      limitPrice,
      maxBaseQuantity,
      maxQuoteQuantity,
      selfTradeBehavior,
      orderType,
      clientId,
    );
    transactionIxs.push(placeOrderInstruction);

    return {ixs: transactionIxs, signers: additionalSigners};
  }

  async prepCancelSpotOrderTx(
    mangoAccount: MangoAccount,
    ownerPk: PublicKey,
    spotMarket: Market,
    order: Order,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];

    const instruction = makeCancelSpotOrderInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      ownerPk,
      mangoAccount.publicKey,
      spotMarket.programId,
      spotMarket.publicKey,
      spotMarket['_decoded'].bids,
      spotMarket['_decoded'].asks,
      order.openOrdersAddress,
      this.group.signerKey,
      spotMarket['_decoded'].eventQueue,
      order,
    );
    transactionIxs.push(instruction);

    await this.addSpotSettleFundsIx(transactionIxs, this.group, mangoAccount, spotMarket, ownerPk);

    return {ixs: transactionIxs, signers: []};
  }

  async prepSettleSpotTx(
    mangoAccount: MangoAccount,
    spotMarkets: Market[],
    ownerPk: PublicKey,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];

    for (let i = 0; i < spotMarkets.length; i += 1) {
      const openOrdersAccount: any = mangoAccount.spotOpenOrdersAccounts[i];
      if (openOrdersAccount === undefined) {
        continue;
      } else if (
        openOrdersAccount.quoteTokenFree.toNumber()
          + openOrdersAccount['referrerRebatesAccrued'].toNumber()
          === 0
        && openOrdersAccount.baseTokenFree.toNumber() === 0
      ) {
        continue;
      }
      const spotMarket = spotMarkets[i];
      await this.addSpotSettleFundsIx(transactionIxs, this.group, mangoAccount, spotMarket, ownerPk);
    }

    return {ixs: transactionIxs, signers: []}
  }

  async prepPlacePerpOrderTx(
    mangoAccount: MangoAccount,
    mangoCachePk: PublicKey,
    perpMarket: PerpMarket,
    ownerPk: PublicKey,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    clientOrderId = 0,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];

    const marketIndex = this.group.getPerpMarketIndex(perpMarket.publicKey);

    // This will not work for perp markets without spot market
    const baseTokenInfo = this.group.tokens[marketIndex];
    const quoteTokenInfo = this.group.tokens[QUOTE_INDEX];
    const baseUnit = Math.pow(10, baseTokenInfo.decimals);
    const quoteUnit = Math.pow(10, quoteTokenInfo.decimals);

    const nativePrice = new BN(price * quoteUnit)
      .mul(perpMarket.baseLotSize as BN)
      .div(perpMarket.quoteLotSize.mul(new BN(baseUnit)) as BN);
    const nativeQuantity = new BN(size * baseUnit).div(
      perpMarket.baseLotSize as BN,
    );

    const instruction = makePlacePerpOrderInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      mangoAccount.publicKey,
      ownerPk,
      mangoCachePk,
      perpMarket.publicKey,
      perpMarket.bids,
      perpMarket.asks,
      perpMarket.eventQueue,
      mangoAccount.spotOpenOrders,
      nativePrice,
      nativeQuantity,
      new BN(clientOrderId),
      side,
      orderType,
    );
    transactionIxs.push(instruction);

    return {ixs: transactionIxs, signers: []}
  }

  async prepCancelPerpOrderTx(
    mangoAcc: MangoAccount,
    ownerPk: PublicKey,
    perpMarket: PerpMarket,
    order: PerpOrder,
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];
    const instruction = makeCancelPerpOrderInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      mangoAcc.publicKey,
      ownerPk,
      perpMarket.publicKey,
      perpMarket.bids,
      perpMarket.asks,
      order,
      false,
    );
    transactionIxs.push(instruction);

    return {ixs: transactionIxs, signers: []}
  }

  async prepSettlePerpTx(
    mangoCache: MangoCache,
    mangoAcc: MangoAccount,
    perpMarket: PerpMarket,
    quoteRootBank: RootBank,
    price: I80F48, // should be the MangoCache price
  ): Promise<ixsAndSigners> {
    const transactionIxs: TransactionInstruction[] = [];
    // fetch all MangoAccounts filtered for having this perp market in basket
    const marketIndex = this.group.getPerpMarketIndex(perpMarket.publicKey);
    const perpMarketInfo = this.group.perpMarkets[marketIndex];
    let pnl = mangoAcc.perpAccounts[marketIndex].getPnl(
      perpMarketInfo,
      mangoCache.perpMarketCache[marketIndex],
      price,
    );

    let sign: number;
    if (pnl.eq(ZERO_I80F48)) {
      // Can't settle pnl if there is no pnl
      return {ixs: [], signers: []};
    } else if (pnl.gt(ZERO_I80F48)) {
      sign = 1;
    } else {
      // Can settle fees first against perpmarket

      sign = -1;
      if (!quoteRootBank.nodeBankAccounts) {
        await quoteRootBank.loadNodeBanks(this.connection);
      }
      const settleFeesInstr = makeSettleFeesInstruction(
        MANGO_PROG_ID,
        this.group.publicKey,
        mangoCache.publicKey,
        perpMarket.publicKey,
        mangoAcc.publicKey,
        quoteRootBank.publicKey,
        quoteRootBank.nodeBanks[0],
        quoteRootBank.nodeBankAccounts[0].vault,
        this.group.feesVault,
        this.group.signerKey,
      );
      transactionIxs.push(settleFeesInstr);
      pnl = pnl.add(perpMarket.feesAccrued).min(I80F48.fromString('-0.000001'));
      const remSign = pnl.gt(ZERO_I80F48) ? 1 : -1;
      if (remSign !== sign) {
        // if pnl has changed sign, then we're done
        return {ixs: transactionIxs, signers: []}
      }
    }

    const mangoAccounts = await this.nativeClient.getAllMangoAccounts(this.group, [], false);

    const accountsWithPnl = mangoAccounts
      .map((m) => ({
        account: m,
        pnl: m.perpAccounts[marketIndex].getPnl(
          perpMarketInfo,
          mangoCache.perpMarketCache[marketIndex],
          price,
        ),
      }))
      .sort((a, b) => sign * a.pnl.cmp(b.pnl));

    // eslint-disable-next-line no-restricted-syntax
    for (const account of accountsWithPnl) {
      // ignore own account explicitly
      if (account.account.publicKey.equals(mangoAcc.publicKey)) {
        continue;
      }
      if (
        ((pnl.isPos() && account.pnl.isNeg())
          || (pnl.isNeg() && account.pnl.isPos()))
          && transactionIxs.length < 10
      ) {
        // Account pnl must have opposite signs
        const instr = makeSettlePnlInstruction(
          MANGO_PROG_ID,
          this.group.publicKey,
          mangoAcc.publicKey,
          account.account.publicKey,
          this.group.mangoCache,
          quoteRootBank.publicKey,
          quoteRootBank.nodeBanks[0],
          new BN(marketIndex),
        );
        transactionIxs.push(instr);
        pnl = pnl.add(account.pnl);
        // if pnl has changed sign, then we're done
        const remSign = pnl.gt(ZERO_I80F48) ? 1 : -1;
        if (remSign !== sign) {
          break;
        }
      } else {
        // means we ran out of accounts to settle against (shouldn't happen) OR transaction too big
        // TODO - create a multi tx to be signed by user
        continue;
      }
    }

    return {ixs: transactionIxs, signers: []}
  }
}
