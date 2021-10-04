/* eslint-disable no-else-return */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable dot-notation */
import {
  Cluster,
  createAccountInstruction,
  getAllMarkets,
  getMultipleAccounts,
  IDS,
  Config,
  makeDepositInstruction,
  makeInitMangoAccountInstruction,
  makeWithdrawInstruction,
  makeSettleFundsInstruction,
  makePlaceSpotOrderInstruction,
  makeInitSpotOpenOrdersInstruction,
  makeCancelSpotOrderInstruction,
  makePlacePerpOrderInstruction,
  QUOTE_INDEX,
  MangoAccount,
  MangoAccountLayout,
  MangoClient as NativeMangoClient,
  MangoGroup,
  uiToNative,
  ZERO_BN,
  zeroKey,
  nativeToUi,
  PerpMarket,
  makeCancelPerpOrderInstruction,
  I80F48,
  makeSettleFeesInstruction,
  makeSettlePnlInstruction,
  MangoCache,
  RootBank,
  ZERO_I80F48,
  GroupConfig,
  MarketConfig,
  makeCancelAllPerpOrdersInstruction
} from '@blockworks-foundation/mango-client';
import {
  closeAccount,
  initializeAccount,
  WRAPPED_SOL_MINT,
} from '@project-serum/serum/lib/token-instructions';
import {getFeeRates, getFeeTier, Market, OpenOrders,} from '@project-serum/serum';
import {Order,} from '@project-serum/serum/lib/market';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID,} from '@solana/spl-token';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import debug from 'debug';
import {instructionsAndSigners, side, orderType} from '@dbricks/dbricks-ts';
import BN from 'bn.js';
import * as fs from 'fs';
import SolClient from '../../common/client/common.client';
import {COMMITTMENT, MANGO_PROG_ID, NETWORK, SERUM_PROG_ID} from '../../config/config';

const log: debug.IDebugger = debug('app:mango-client');

export type BankVaultInformation = {
  rootBank: PublicKey;
  nodeBank: PublicKey;
  vault: PublicKey;
};

export default class MangoClient extends SolClient {
  MANGO_CONFIG_PATH: string = './mangoConfig.json';

  nativeClient: NativeMangoClient;

  group!: MangoGroup;

  groupName: string;

  cluster: Cluster;

  config: Config;

  constructor() {
    super();
    this.nativeClient = new NativeMangoClient(this.connection, MANGO_PROG_ID);
    this.config = new Config(IDS);
    if (NETWORK === 'mainnet') {
      this.groupName = 'mainnet.1';
      this.cluster = 'mainnet';
    } else if (NETWORK === 'devnet') {
      this.groupName = 'devnet.2';
      this.cluster = 'devnet';
    } else {
      this.groupName = 'localnet.1';
      this.cluster = 'localnet';
      this.config = this.readConfig();
    }
    log('Initialized Mango client');
  }

  async prepareDepositTransaction(
    ownerPubkey: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,
    tokenAccount: PublicKey,
    quantity: number,
    mangoAccountNumber:number,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    const tokenIndex = this.group.getRootBankIndex(rootBank);
    const tokenMint = this.group.tokens[tokenIndex].mint;
    const mangoAccounts = await this.loadUserAccounts(ownerPubkey);

    let destinationPubkey: PublicKey;
    if (mangoAccounts.length === 0) { // Init Mango Account before deposit
      const [newAccountInstructionsAndSigners, newAccountPubkey] = await this.prepareCreateMangoAccountTransaction(ownerPubkey);
      instructionsAndSigners.instructions.push(...newAccountInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...newAccountInstructionsAndSigners.signers);
      destinationPubkey = newAccountPubkey;
    } else {
      // TODO: UI should always pass a valid number, but what if it doesn't?
      destinationPubkey = mangoAccounts[mangoAccountNumber].publicKey;
    }

    let wrappedSolAccount: Keypair | null = null;
    if (
      tokenMint.equals(WRAPPED_SOL_MINT)
      && tokenAccount.toBase58() === ownerPubkey.toBase58()
    ) {
      const [newAccount, createMangoAccountInstructionsAndSigners] = await this.prepareWrappedSolCreateAccountInstruction(
        ownerPubkey,
        quantity,
      );
      wrappedSolAccount = newAccount;
      instructionsAndSigners.instructions.push(...createMangoAccountInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...createMangoAccountInstructionsAndSigners.signers);
    }

    const nativeQuantity = uiToNative(
      quantity,
      this.group.tokens[tokenIndex].decimals,
    );

    const depositInstruction = makeDepositInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      ownerPubkey,
      this.group.mangoCache,
      destinationPubkey,
      rootBank,
      nodeBank,
      vault,
      wrappedSolAccount ? wrappedSolAccount.publicKey : tokenAccount,
      nativeQuantity,
    );
    instructionsAndSigners.instructions.push(depositInstruction);

    if (wrappedSolAccount) {
      const closeWrappedSolAccountInstructionsAndSigners = this.prepareWrappedSolCloseAccountInstruction(
        ownerPubkey,
        wrappedSolAccount,
      );
      instructionsAndSigners.instructions.push(...closeWrappedSolAccountInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...closeWrappedSolAccountInstructionsAndSigners.signers);
    }
    return instructionsAndSigners;
  }

  async prepareWithdrawTransaction(
    mangoAccount: MangoAccount,
    ownerPubkey: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,
    quantity: number,
    allowBorrow: boolean,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    const tokenIndex = this.group.getRootBankIndex(rootBank);
    const tokenMint = this.group.tokens[tokenIndex].mint;

    let tokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      ownerPubkey,
    );

    let wrappedSolAccount: Keypair | null = null;
    if (tokenMint.equals(WRAPPED_SOL_MINT)) {
      const [newAcc, createMangoAccInstructionsAndSigners] = await this.prepareWrappedSolCreateAccountInstruction(
        ownerPubkey,
      );
      wrappedSolAccount = newAcc;
      instructionsAndSigners.instructions.push(...createMangoAccInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...createMangoAccInstructionsAndSigners.signers);
      tokenAccount = wrappedSolAccount.publicKey;
    } else {
      const tokenAccExists = await this.connection.getAccountInfo(
        tokenAccount,
        'recent',
      );
      if (!tokenAccExists) {
        instructionsAndSigners.instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenMint,
            tokenAccount,
            ownerPubkey,
            ownerPubkey,
          ),
        );
      }
    }

    const nativeQuantity = uiToNative(
      quantity,
      this.group.tokens[tokenIndex].decimals,
    );

    const withdrawInstruction = makeWithdrawInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      mangoAccount.publicKey,
      ownerPubkey,
      this.group.mangoCache,
      rootBank,
      nodeBank,
      vault,
      tokenAccount,
      this.group.signerKey,
      mangoAccount.spotOpenOrders,
      nativeQuantity,
      allowBorrow,
    );
    instructionsAndSigners.instructions.push(withdrawInstruction);

    if (wrappedSolAccount) {
      const closeWrappedSolAccountInstructionsAndSigners = this.prepareWrappedSolCloseAccountInstruction(
        ownerPubkey,
        wrappedSolAccount,
      );
      instructionsAndSigners.instructions.push(...closeWrappedSolAccountInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...closeWrappedSolAccountInstructionsAndSigners.signers);
    }

    return instructionsAndSigners;
  }

  async preparePlaceSpotOrderTransaction(
    mangoGroup: MangoGroup,
    mangoAccount: MangoAccount,
    mangoCache: PublicKey,
    spotMarket: Market,
    ownerPubkey: PublicKey,
    side: side,
    price: number,
    size: number,
    orderType?: orderType,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
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

          const accTransaction = await createAccountInstruction(
            this.connection,
            ownerPubkey,
            openOrdersSpace,
            mangoGroup.dexProgramId,
            openOrdersLamports,
          );

          const initOpenOrdersInstruction = makeInitSpotOpenOrdersInstruction(
            MANGO_PROG_ID,
            mangoGroup.publicKey,
            mangoAccount.publicKey,
            ownerPubkey,
            mangoGroup.dexProgramId,
            accTransaction.account.publicKey,
            spotMarket.publicKey,
            mangoGroup.signerKey,
          );

          instructionsAndSigners.instructions.push(accTransaction.instruction);
          instructionsAndSigners.instructions.push(initOpenOrdersInstruction);
          instructionsAndSigners.signers.push(accTransaction.account);

          pubkey = accTransaction.account.publicKey;
        } else {
          pubkey = mangoAccount.spotOpenOrders[i];
        }
      } else if (mangoAccount.inMarginBasket[i]) {
        pubkey = mangoAccount.spotOpenOrders[i];
      }

      openOrdersKeys.push({pubkey, isWritable});
    }

    const dexSigner = await PublicKey.createProgramAddress(
      [
        spotMarket.publicKey.toBuffer(),
        spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
      ],
      spotMarket.programId,
    );

    const placeSpotOrderInstruction = makePlaceSpotOrderInstruction(
      MANGO_PROG_ID,
      mangoGroup.publicKey,
      mangoAccount.publicKey,
      ownerPubkey,
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
    instructionsAndSigners.instructions.push(placeSpotOrderInstruction);

    return instructionsAndSigners;
  }

  async prepareCancelSpotOrderTransaction(
    mangoAccount: MangoAccount,
    ownerPubkey: PublicKey,
    marketPubkey: PublicKey,
    orderId?: BN,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };

    const spotMarket = await this.loadSpotMarket(marketPubkey);
    const userOpenOrders = mangoAccount.spotOpenOrdersAccounts.find(
      (account) => account?.market.toBase58() === marketPubkey.toBase58(),
    );
    if (!userOpenOrders) {
      throw new Error(`Could not find open orders from: ${mangoAccount.publicKey.toBase58()} for market: ${marketPubkey.toBase58()}`);
    }
    const userOrderIdStrings = userOpenOrders.orders.filter((o) => !o.eq(ZERO_BN)).map((o) => o.toString());
    // Mango aggregates orders from different users into a single Serum open orders account for fee discounts
    const mangoOpenOrders = await spotMarket.loadOrdersForOwner(this.connection, userOpenOrders.owner); // Here owner is the Serum open orders account, not the user
    let orders: Order[];
    if (orderId) {
      orders = [mangoOpenOrders.find((o) => o.orderId.toString() === orderId!.toString()) as Order];
    } else {
      orders = mangoOpenOrders.filter((o) => userOrderIdStrings.includes(o.orderId.toString())) as Order[];
    }

    orders.forEach((order) => {
      const cancelSpotOrderInstruction = makeCancelSpotOrderInstruction(
        MANGO_PROG_ID,
        this.group.publicKey,
        ownerPubkey,
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
      instructionsAndSigners.instructions.push(cancelSpotOrderInstruction);
    });

    const prepareSpotSettleFundsInstructionAndSigners = await this.prepareSpotSettleFundsInstruction(this.group, mangoAccount, spotMarket, ownerPubkey);
    instructionsAndSigners.instructions.push(...prepareSpotSettleFundsInstructionAndSigners.instructions);
    instructionsAndSigners.signers.push(...prepareSpotSettleFundsInstructionAndSigners.signers);

    return instructionsAndSigners;
  }

  async prepareSettleSpotTransaction(
    mangoAccount: MangoAccount,
    spotMarket: Market,
    ownerPubkey: PublicKey,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    const prepareSpotSettleFundsInstructionAndSigners = await this.prepareSpotSettleFundsInstruction(
      this.group, mangoAccount, spotMarket, ownerPubkey,
    );
    instructionsAndSigners.instructions.push(...prepareSpotSettleFundsInstructionAndSigners.instructions);
    instructionsAndSigners.signers.push(...prepareSpotSettleFundsInstructionAndSigners.signers);

    return instructionsAndSigners;
  }

  async preparePlacePerpOrderTransaction(
    mangoAccount: MangoAccount,
    mangoCachePubkey: PublicKey,
    perpMarket: PerpMarket,
    ownerPubkey: PublicKey,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    clientOrderId = 0,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };

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

    const placePerpOrderInstruction = makePlacePerpOrderInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      mangoAccount.publicKey,
      ownerPubkey,
      mangoCachePubkey,
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
    instructionsAndSigners.instructions.push(placePerpOrderInstruction);

    return instructionsAndSigners;
  }

  async prepareCancelPerpOrderTransaction(
    mangoAccount: MangoAccount,
    ownerPubkey: PublicKey,
    perpMarket: PerpMarket,
    orderId?: BN,
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };

    if (orderId) {
      const openOrders = await perpMarket.loadOrdersForAccount(
        this.connection,
        mangoAccount,
      );
      const order = openOrders.find((o) => o.orderId.toString() === orderId.toString());
      if (!order) {
        throw new Error(`Could not find perp order: ${orderId.toString()}`);
      }
      const cancelPerpOrderInstruction = makeCancelPerpOrderInstruction(
        MANGO_PROG_ID,
        this.group.publicKey,
        mangoAccount.publicKey,
        ownerPubkey,
        perpMarket.publicKey,
        perpMarket.bids,
        perpMarket.asks,
        order,
        false,
      );
      instructionsAndSigners.instructions.push(cancelPerpOrderInstruction);
    } else {
      const cancelPerpOrderInstruction = makeCancelAllPerpOrdersInstruction(
        MANGO_PROG_ID,
        this.group.publicKey,
        mangoAccount.publicKey,
        ownerPubkey,
        perpMarket.publicKey,
        perpMarket.bids,
        perpMarket.asks,
        new BN(50),
      );
      instructionsAndSigners.instructions.push(cancelPerpOrderInstruction);
    }

    return instructionsAndSigners;
  }

  async prepareSettlePerpTransaction(
    mangoCache: MangoCache,
    mangoAcc: MangoAccount,
    perpMarket: PerpMarket,
    quoteRootBank: RootBank,
    price: I80F48, // should be the MangoCache price
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
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
      return instructionsAndSigners;
    } else if (pnl.gt(ZERO_I80F48)) {
      sign = 1;
    } else {
      // Can settle fees first against perpmarket

      sign = -1;
      if (!quoteRootBank.nodeBankAccounts) {
        await quoteRootBank.loadNodeBanks(this.connection);
      }
      const settleFeesInstruction = makeSettleFeesInstruction(
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
      instructionsAndSigners.instructions.push(settleFeesInstruction);
      pnl = pnl.add(perpMarket.feesAccrued).min(I80F48.fromString('-0.000001'));
      const remSign = pnl.gt(ZERO_I80F48) ? 1 : -1;
      if (remSign !== sign) {
        // if pnl has changed sign, then we're done
        return instructionsAndSigners;
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
        && instructionsAndSigners.instructions.length < 10
      ) {
        // Account pnl must have opposite signs
        const settleInstruction = makeSettlePnlInstruction(
          MANGO_PROG_ID,
          this.group.publicKey,
          mangoAcc.publicKey,
          account.account.publicKey,
          this.group.mangoCache,
          quoteRootBank.publicKey,
          quoteRootBank.nodeBanks[0],
          new BN(marketIndex),
        );
        instructionsAndSigners.instructions.push(settleInstruction);
        pnl = pnl.add(account.pnl);
        // if pnl has changed sign, then we're done
        const remSign = pnl.gt(ZERO_I80F48) ? 1 : -1;
        if (remSign !== sign) {
          break;
        }
      } else {
        // means we ran out of accounts to settle against (shouldn't happen) OR transaction too big
        // TODO - create a multi transaction to be signed by user
        continue;
      }
    }

    return instructionsAndSigners;
  }

  // --------------------------------------- helpers (passive)

  readConfig(): Config {
    return new Config(JSON.parse(fs.readFileSync(this.MANGO_CONFIG_PATH, 'utf-8')));
  }

  async loadGroup(): Promise<void> {
    const groupPubkey = this.config.groups.find(
      (group) => group.name === this.groupName,
    )?.publicKey;
    if (!groupPubkey) {
      throw new Error('Error finding Mango group');
    }
    const mangoGroup = await this.nativeClient.getMangoGroup(
      new PublicKey(groupPubkey),
    );
    await mangoGroup.loadRootBanks(this.connection);
    await Promise.all(
      mangoGroup.rootBankAccounts.map((rootBank) => rootBank?.loadNodeBanks(this.connection)),
    ); // load each nodeBank for all rootBanks
    this.group = mangoGroup;
  }

  async loadUserAccounts(ownerPubkey: PublicKey): Promise<MangoAccount[]> {
    if (!this.group) {
      await this.loadGroup();
    }
    try {
      return this.nativeClient.getMangoAccountsForOwner(
        this.group,
        ownerPubkey,
        true,
      );
    } catch (err) {
      log('Could not load Mango margin accounts', err);
      return [];
    }
  }

  async loadMangoAccountForOwner(
    ownerPubkey: PublicKey,
    mangoAccountNumber: number,
  ): Promise<MangoAccount> {
    const loadedMangoAccount = (await this.loadUserAccounts(
      ownerPubkey,
    ))[mangoAccountNumber];
    return this.nativeClient.getMangoAccount(loadedMangoAccount.publicKey, SERUM_PROG_ID);
  }

  async loadBankVaultInformation(
    mintPubkey: PublicKey,
  ): Promise<BankVaultInformation> {
    if (!this.group) {
      await this.loadGroup();
    }
    const tokenIndex = this.group.getTokenIndex(mintPubkey);
    const {rootBank} = this.group.tokens[tokenIndex];
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

  async getAllMarketInfos(): Promise<{
    allMarketConfigs: MarketConfig[];
    allMarketAccountInfos: {
        accountInfo: {
            data: any;
        };
    }[];
    mangoGroupConfig: GroupConfig;
}> {
    if (!this.group) {
      await this.loadGroup();
    }
    const mangoGroupConfig = this.getMangoGroupConfig();
    const allMarketConfigs = getAllMarkets(mangoGroupConfig);
    const allMarketPubkeys = allMarketConfigs.map((m) => m.publicKey);

    let allMarketAccountInfos: { accountInfo: { data: any; }; }[];
    try {
      const responses = await Promise.all([
        getMultipleAccounts(this.connection, allMarketPubkeys),
        this.group.loadCache(this.connection),
        this.group.loadRootBanks(this.connection),
      ]);
      allMarketAccountInfos = responses[0];
    } catch {
      throw new Error('Failed to load markets');
    }
    return {allMarketConfigs, allMarketAccountInfos, mangoGroupConfig};
  }

  async loadSpotMarket(marketPubkey: PublicKey) {
    const mangoGroupConfig = this.getMangoGroupConfig();
    const spotMarketConfig = mangoGroupConfig.spotMarkets.find(
      (p) => p.publicKey.toBase58() === marketPubkey.toBase58(),
    );
    if (!spotMarketConfig) {
      throw new Error(`Could not find spot market ${marketPubkey.toBase58()}`);
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

  getMangoGroupConfig(): GroupConfig {
    const mangoGroupConfig = this.config.getGroup(
      this.cluster,
      this.groupName,
    );
    if (!mangoGroupConfig) {
      throw new Error('Error loading Mango Group Configuration');
    }
    return mangoGroupConfig;
  }

  async loadPerpMarket(marketPubkey: PublicKey) {
    const mangoGroupConfig = this.getMangoGroupConfig();
    const perpMarketConfig = mangoGroupConfig.perpMarkets.find(
      (p) => p.publicKey.toBase58() === marketPubkey.toBase58(),
    );
    if (!perpMarketConfig) {
      throw new Error(`Could not find perp market ${marketPubkey.toBase58()}`);
    }
    return this.nativeClient.getPerpMarket(
      perpMarketConfig.publicKey,
      perpMarketConfig.baseDecimals,
      perpMarketConfig.quoteDecimals,
    );
  }

  // --------------------------------------- helpers (active)

  async prepareWrappedSolCreateAccountInstruction(
    ownerPubkey: PublicKey,
    quantity?: number,
  ): Promise<[Keypair, instructionsAndSigners]> {
    const wrappedSolAccount = new Keypair();
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    let lamports: number;
    if (quantity) {
      // depositTransactionn
      lamports = Math.round(quantity * LAMPORTS_PER_SOL) + 1e7;
    } else {
      // withdrawTransactionn
      lamports = await this.connection.getMinimumBalanceForRentExemption(
        165,
        COMMITTMENT,
      );
    }
    instructionsAndSigners.instructions.push(
      SystemProgram.createAccount({
        fromPubkey: ownerPubkey,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports,
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
    );

    instructionsAndSigners.instructions.push(
      initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: ownerPubkey,
      }),
    );

    instructionsAndSigners.signers.push(wrappedSolAccount);

    return [wrappedSolAccount, instructionsAndSigners];
  }

  prepareWrappedSolCloseAccountInstruction(
    ownerPubkey: PublicKey,
    wrappedSolAccount: Keypair,
  ): instructionsAndSigners {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    instructionsAndSigners.instructions.push(
      closeAccount({
        source: wrappedSolAccount.publicKey,
        destination: ownerPubkey,
        owner: ownerPubkey,
      }),
    );
    return instructionsAndSigners;
  }

  async prepareSpotSettleFundsInstruction(
    mangoGroup: MangoGroup, mangoAcc: MangoAccount, spotMarket: Market, ownerPubkey: PublicKey
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
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

    const settleInstruction = makeSettleFundsInstruction(
      MANGO_PROG_ID,
      mangoGroup.publicKey,
      mangoGroup.mangoCache,
      ownerPubkey,
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

    instructionsAndSigners.instructions.push(settleInstruction);
    return instructionsAndSigners;
  }

  async prepareCreateMangoAccountTransaction(
    ownerPubkey: PublicKey,
  ): Promise<[instructionsAndSigners, PublicKey]> {
    const newMangoAccount = await createAccountInstruction(
      this.connection,
      ownerPubkey,
      MangoAccountLayout.span,
      MANGO_PROG_ID,
    );
    const initMangoAccountInstruction = makeInitMangoAccountInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      newMangoAccount.account.publicKey,
      ownerPubkey,
    );
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [newMangoAccount.instruction, initMangoAccountInstruction],
      signers: [newMangoAccount.account],
    };
    return [instructionsAndSigners, newMangoAccount.account.publicKey];
  }
}
