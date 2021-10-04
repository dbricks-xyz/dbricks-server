/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable dot-notation */
import request from 'supertest';
import {Cluster, Config, getMultipleAccounts, getOracleBySymbol, getPerpMarketByBaseSymbol, getSpotMarketByBaseSymbol, getTokenBySymbol, makeCachePerpMarketsInstruction, makeCachePricesInstruction, makeCacheRootBankInstruction, makeUpdateFundingInstruction, makeUpdateRootBankInstruction, MangoCache, MangoGroup, OracleConfig, PerpEventQueue, PerpEventQueueLayout, PerpMarket, uiToNative, zeroKey} from '@blockworks-foundation/mango-client';
import * as fs from 'fs';
import {Account, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Market } from '@project-serum/serum';
import { deserializeInstructionsAndSigners, IMangoDEXOrderCancelParams, IMangoDEXOrderPlaceParams, IMangoLenderDepositParams, IMangoLenderWithdrawParams, ISerumDEXMarketInitParams, instructionsAndSigners, orderType, side, IMangoDEXMarketSettleParams } from 'dbricks-lib';
import BN from 'bn.js';
import MangoClient from '../../src/mango/client/mango.client';
import app from '../../src/app';
import { loadKeypairSync } from '../../src/common/util/common.util';
import { TESTING_KEYPAIR_PATH, SERUM_PROG_ID, MANGO_PROG_ID } from '../../src/config/config';
import { saveRequestResponseToJSON } from '../../docs/docs.generator';

require('dotenv').config();

export default class MangoTester extends MangoClient {
  groupName: string = 'localnet.1';

  baseMint!: Token;

  quoteMint!: Token;

  marketKeypair!: Keypair;

  user1Keypair: Keypair;

  perpMarketPubkey!: PublicKey;

  user2Keypair: Keypair = new Keypair();

  baseUser1Pubkey!: PublicKey;

  quoteUser1Pubkey!: PublicKey;

  baseUser2Pubkey!: PublicKey;

  quoteUser2Pubkey!: PublicKey;

  mngoMintPubkey!: PublicKey

  validInterval: number = 100; // the interval where caches are no longer valid (UNIX timestamp)

  // These params typically differ across currencies (and Spot vs Perp) based on risk
  // Since this is just for simple testing, it's ok to reuse them for everything
  optimalUtil: number = 0.7; // optimal utilization interest rate param for currency

  optimalRate: number = 0.06; // optimal interest rate param for currency

  maxRate: number = 1.5; // max interest rate param for currency

  maintLeverage: number = 20; // max leverage, if you exceed this you will be liquidated

  initLeverage: number = 10; // largest leverage at which you can open a position

  liquidationFee: number = 0.05;

  constructor() {
    super();
    this.user1Keypair = loadKeypairSync(TESTING_KEYPAIR_PATH);
  }

  get user1Pubkey() {
    return this.user1Keypair.publicKey;
  }

  get user2Pubkey() {
    return this.user2Keypair.publicKey;
  }

  async getCache(): Promise<MangoCache> {
    return this.group.loadCache(this.connection);
  }

  getTokenIndex(mintPubkey: PublicKey): number {
    return this.group.getTokenIndex(mintPubkey);
  }

  writeConfig(configPath: string, config: Config): void {
    fs.writeFileSync(configPath, JSON.stringify(config.toJson(), null, 2));
  }

  // --------------------------------------- preparators

  async setupLocalForTests(): Promise<void> {
    // Setup Tokens, Mints, and Serum Markets
    await this.prepareAccounts();
    await this.prepareMarket();
    this.mngoMintPubkey = (await this._createMint(this.user1Keypair)).publicKey;
    // Setup MangoGroup
    const mangoGroupPubkey = await this.createMangoGroup();

    // add oracles
    await this.addPriceOracle(mangoGroupPubkey, 'QUOTE');
    await this.addPriceOracle(mangoGroupPubkey, 'BASE');

    // set oracle prices
    await this.setOraclePrice('QUOTE', 1);
    await this.setOraclePrice('BASE', 1);

    // add spot market
    await this.addSpotMarket('BASE', this.marketKeypair.publicKey, this.baseMint.publicKey);

    // enable perp market
    // await this.addPerpMarket('BASE');

    // persist mango
    console.log('Mango was set up successfully');
    this.writeConfig(this.MANGO_CONFIG_PATH, this.config);
    console.log('config saved');
  }

  async prepareAccounts(): Promise<void> {
    // token mints
    this.baseMint = await this._createMint(this.user1Keypair);
    this.quoteMint = await this._createMint(this.user1Keypair);

    // user 1 - we give them quote
    this.baseUser1Pubkey = await this._createTokenAccount(this.baseMint, this.user1Pubkey);
    this.quoteUser1Pubkey = await this._createTokenAccount(this.quoteMint, this.user1Pubkey);
    await this._fundTokenAccount(this.quoteMint, this.user1Pubkey, this.quoteUser1Pubkey, 100000);

    // user 2 - we give them base
    await this._transferLamports(this.user1Keypair, this.user2Keypair.publicKey, LAMPORTS_PER_SOL);
    this.baseUser2Pubkey = await this._createTokenAccount(this.baseMint, this.user2Pubkey);
    this.quoteUser2Pubkey = await this._createTokenAccount(this.quoteMint, this.user2Pubkey);
    await this._fundTokenAccount(this.baseMint, this.user1Pubkey, this.baseUser2Pubkey, 100000);
  }

  async prepareMarket(): Promise<void> {
    const [transaction1, transaction2] = await this.requestInitMarketInstruction();
    transaction1.signers.unshift(this.user1Keypair);
    transaction2.signers.unshift(this.user1Keypair);
    await this._prepareAndSendTransaction(transaction1);
    await this._prepareAndSendTransaction(transaction2);
    this.marketKeypair = transaction1.signers[1] as Keypair;
  }

  async initializeFeeVault(): Promise<PublicKey> {
    const [createInsuranceVaultInstructionsandSigners, feeVaultPubkey] = await
    this.prepareCreateTokenAccountTransaction(
      this.user1Keypair.publicKey, this.quoteMint.publicKey, TOKEN_PROGRAM_ID,
    );

    const createAccountsTransaction = new Transaction();
    createAccountsTransaction.add(...createInsuranceVaultInstructionsandSigners.instructions);
    await this.connection.sendTransaction(
      createAccountsTransaction,
      [this.user1Keypair, ...createInsuranceVaultInstructionsandSigners.signers],
    );
    console.log('Fees vault initialized');
    return feeVaultPubkey;
  }

  async createMangoGroup(): Promise<PublicKey> {
    const feesVaultPubkey = await this.initializeFeeVault();
    const cluster = 'localnet' as Cluster;

    const groupPubkey = await this.nativeClient.initMangoGroup(
      this.quoteMint.publicKey,
      zeroKey,
      SERUM_PROG_ID,
      feesVaultPubkey,
      this.validInterval,
      this.optimalUtil,
      this.optimalRate,
      this.maxRate,
      this.user1Keypair as unknown as Account,
    );
    console.log('Mango Group initialized');
    const group = await this.nativeClient.getMangoGroup(groupPubkey);
    const rootBanks = await group.loadRootBanks(this.connection);
    const tokenIndex = group.getTokenIndex(this.quoteMint.publicKey);
    const nodeBanks = await rootBanks[tokenIndex]?.loadNodeBanks(this.connection);
    console.log('Root and node banks loaded');

    const tokenDesc = {
      symbol: 'QUOTE',
      mintKey: this.quoteMint.publicKey,
      decimals: group.tokens[tokenIndex].decimals,
      rootKey: rootBanks[tokenIndex]?.publicKey as PublicKey,
      nodeKeys: nodeBanks?.map((n) => n?.publicKey) as PublicKey[],
    };
    const groupDesc = {
      cluster,
      name: this.groupName,
      publicKey: groupPubkey,
      quoteSymbol: 'QUOTE',
      mangoProgramId: MANGO_PROG_ID,
      serumProgramId: SERUM_PROG_ID,
      tokens: [tokenDesc],
      oracles: [],
      perpMarkets: [],
      spotMarkets: [],
    };

    this.config.storeGroup(groupDesc);
    return groupPubkey;
  }

  async addPriceOracle(mangoGroupPubkey: PublicKey, symbol: string): Promise<void> {
    await this.nativeClient.addStubOracle(
      mangoGroupPubkey, this.user1Keypair as unknown as Account,
    );
    const group = await this.nativeClient.getMangoGroup(mangoGroupPubkey);
    const groupConfig = this.config.groups[0];

    const oracle = {
      symbol,
      publicKey: group.oracles[group.numOracles - 1],
    };
    const foundOracle = getOracleBySymbol(groupConfig, symbol);
    if (foundOracle) {
      Object.assign(foundOracle, oracle);
    } else {
      groupConfig.oracles.push(oracle);
    }
    this.config.storeGroup(groupConfig);
    console.log(`${symbol} price oracle added`);
  }

  async setOraclePrice(symbol: string, price: number) {
    const groupConfig = this.config.groups[0];
    const oracle = getOracleBySymbol(groupConfig, symbol) as OracleConfig;
    await this.nativeClient.setStubOracle(
      groupConfig.publicKey,
      oracle.publicKey,
      this.user1Keypair as unknown as Account,
      price,
    );
  }

  async addSpotMarket(
    baseSymbol: string,
    spotMarket: PublicKey,
    baseMint: PublicKey,
  ): Promise<void> {
    const groupConfig = this.config.groups[0];

    let group = await this.nativeClient.getMangoGroup(groupConfig.publicKey);
    const oracleDesc = getOracleBySymbol(groupConfig, baseSymbol) as OracleConfig;

    await this.nativeClient.addSpotMarket(
      group,
      oracleDesc.publicKey,
      spotMarket,
      baseMint,
      this.user1Keypair as unknown as Account,
      this.maintLeverage,
      this.initLeverage,
      this.liquidationFee,
      this.optimalUtil,
      this.optimalRate,
      this.maxRate,
    );

    group = await this.nativeClient.getMangoGroup(groupConfig.publicKey);
    const market = await Market.load(
      this.connection,
      spotMarket,
      undefined,
      groupConfig.serumProgramId,
    );
    const banks = await group.loadRootBanks(this.connection);
    const tokenIndex = group.getTokenIndex(baseMint);
    const nodeBanks = await banks[tokenIndex]?.loadNodeBanks(this.connection);

    const tokenDesc = {
      symbol: baseSymbol,
      mintKey: baseMint,
      decimals: group.tokens[tokenIndex].decimals,
      rootKey: banks[tokenIndex]?.publicKey as PublicKey,
      nodeKeys: nodeBanks?.map((n) => n?.publicKey) as PublicKey[],
    };

    try {
      const token = getTokenBySymbol(groupConfig, baseSymbol);
      Object.assign(token, tokenDesc);
    } catch (_) {
      groupConfig.tokens.push(tokenDesc);
    }

    const marketDesc = {
      name: `${baseSymbol}/${groupConfig.quoteSymbol}`,
      publicKey: spotMarket,
      baseSymbol,
      baseDecimals: market['_baseSplTokenDecimals'],
      quoteDecimals: market['_quoteSplTokenDecimals'],
      marketIndex: tokenIndex,
      bidsKey: market.bidsAddress,
      asksKey: market.asksAddress,
      eventsKey: market['_decoded'].eventQueue,
    };

    const marketConfig = getSpotMarketByBaseSymbol(groupConfig, baseSymbol);
    if (marketConfig) {
      Object.assign(marketConfig, marketDesc);
    } else {
      groupConfig.spotMarkets.push(marketDesc);
    }

    this.config.storeGroup(groupConfig);
    console.log(`${baseSymbol}/${groupConfig.quoteSymbol} spot market added`);
  }

  // The Mango program has mintPk hardcoded in, the mint check must be disabled for local testing:
  // https://github.com/blockworks-foundation/mango-v3/blob/main/program/src/state.rs#L1672
  async addPerpMarket(
    symbol: string,
  ) {
    const groupConfig = this.config.groups[0];
    const makerFee = 0.0;
    const takerFee = 0.0005;
    const baseLotSize = 1;
    const quoteLotSize = 1;
    const maxNumEvents = 256;
    const rate = 0;
    const maxDepthBps = 200;
    const targetPeriodLength = 3600;
    const mngoPerPeriod = 0;

    let group = await this.nativeClient.getMangoGroup(groupConfig.publicKey);
    const oracleDesc = getOracleBySymbol(groupConfig, symbol) as OracleConfig;
    const marketIndex = group.getOracleIndex(oracleDesc.publicKey);

    // Adding perp market
    let nativeMngoPerPeriod = 0;
    if (rate !== 0) {
      const token = getTokenBySymbol(groupConfig, 'MNGO');
      if (token === undefined) {
        throw new Error('MNGO not found in group config');
      } else {
        nativeMngoPerPeriod = uiToNative(
          mngoPerPeriod,
          token.decimals,
        ).toNumber();
      }
    }

    await this.nativeClient.addPerpMarket(
      group,
      oracleDesc.publicKey,
      this.mngoMintPubkey,
      this.user1Keypair as unknown as Account,
      this.maintLeverage,
      this.initLeverage,
      this.liquidationFee,
      makerFee,
      takerFee,
      baseLotSize,
      quoteLotSize,
      maxNumEvents,
      rate,
      maxDepthBps,
      targetPeriodLength,
      nativeMngoPerPeriod,
    );

    group = await this.nativeClient.getMangoGroup(groupConfig.publicKey);
    this.perpMarketPubkey = group.perpMarkets[marketIndex].perpMarket;
    const baseDecimals = getTokenBySymbol(groupConfig, symbol)
      ?.decimals as number;
    const quoteDecimals = getTokenBySymbol(groupConfig, groupConfig.quoteSymbol)
      ?.decimals as number;
    const market = await this.nativeClient.getPerpMarket(
      this.perpMarketPubkey,
      baseDecimals,
      quoteDecimals,
    );

    const marketDesc = {
      name: `${symbol}-PERP`,
      publicKey: this.perpMarketPubkey,
      baseSymbol: symbol,
      baseDecimals,
      quoteDecimals,
      marketIndex,
      bidsKey: market.bids,
      asksKey: market.asks,
      eventsKey: market.eventQueue,
    };

    const marketConfig = getPerpMarketByBaseSymbol(groupConfig, symbol);
    if (marketConfig) {
      Object.assign(marketConfig, marketDesc);
    } else {
      groupConfig.perpMarkets.push(marketDesc);
    }

    this.config.storeGroup(groupConfig);
    console.log(`${symbol}/${groupConfig.quoteSymbol} perp market added`);
  }

  // --------------------------------------- requesters

  async requestDepositTransactionn(mintPubkey: PublicKey, amount: string, userKeypair: Keypair)
  : Promise<instructionsAndSigners[]> {
    const route = '/mango/deposit';
    const params: IMangoLenderDepositParams = {
      mintPubkey: mintPubkey.toBase58(),
      quantity: amount,
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.deposit',
      'mango',
      'POST',
      route,
      params,
      response.body,
    );
    return deserializeInstructionsAndSigners(response.body);
  }

  async requestWithdrawTransactionn(
    mintPubkey: PublicKey, amount: string, userKeypair: Keypair, isBorrow: boolean,
  )
  : Promise<instructionsAndSigners[]> {
    const route = '/mango/withdraw';
    const params: IMangoLenderWithdrawParams = {
      mintPubkey: mintPubkey.toBase58(),
      quantity: amount,
      isBorrow,
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.withdraw',
      'mango',
      'POST',
      route,
      params,
      response.body,
    );
    return deserializeInstructionsAndSigners(response.body);
  }

  async requestPlaceSpotOrderTransactionn(
    marketPubkey: PublicKey,
    side: side,
    price: string,
    size: string,
    orderType: orderType,
    userKeypair: Keypair,
  ): Promise<instructionsAndSigners[]> {
    const route = '/mango/spot/place';
    const params: IMangoDEXOrderPlaceParams = {
      marketPubkey: marketPubkey.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.spot.place',
      'mango',
      'POST',
      route,
      params,
      response.body,
    );
    return deserializeInstructionsAndSigners(response.body);
  }

  async requestCancelSpotOrderTransactionn(
    marketPubkey: PublicKey,
    orderId: string,
    userKeypair: Keypair,
  ): Promise<instructionsAndSigners[]> {
    const route = '/mango/spot/cancel';
    const params: IMangoDEXOrderCancelParams = {
      marketPubkey: marketPubkey.toBase58(),
      orderId,
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.spot.cancel',
      'mango',
      'POST',
      route,
      params,
      response.body,
    );

    return deserializeInstructionsAndSigners(response.body);
  }

  async requestSettleSpotTransactionn(
    marketPubkey: PublicKey,
    userKeypair: Keypair,
  ): Promise<instructionsAndSigners[]> {
    const route = '/mango/spot/settle';
    const params: IMangoDEXMarketSettleParams = {
      marketPubkey: marketPubkey.toBase58(),
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.spot.settle',
      'mango',
      'POST',
      route,
      params,
      response.body,
    );

    return deserializeInstructionsAndSigners(response.body);
  }

  async requestPlacePerpOrderTxn(
    marketPubkey: PublicKey,
    side: side,
    price: string,
    size: string,
    orderType: orderType,
    userKeypair: Keypair,
  ): Promise<instructionsAndSigners[]> {
    const route = '/mango/perp/place';
    const params: IMangoDEXOrderPlaceParams = {
      marketPubkey: marketPubkey.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const res = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.perp.place',
      'mango',
      'POST',
      route,
      params,
      res.body,
    );

    return deserializeInstructionsAndSigners(res.body);
  }

  async requestCancelPerpOrderTxn(
    marketPubkey: PublicKey,
    orderId: string,
    userKeypair: Keypair,
  ): Promise<instructionsAndSigners[]> {
    const route = '/mango/perp/cancel';
    const params: IMangoDEXOrderCancelParams = {
      marketPubkey: marketPubkey.toBase58(),
      orderId,
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const res = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.perp.cancel',
      'mango',
      'POST',
      route,
      params,
      res.body,
    );

    return deserializeInstructionsAndSigners(res.body);
  }

  async requestSettlePerpTransactionn(
    marketPubkey: PublicKey,
    userKeypair: Keypair,
  ): Promise<instructionsAndSigners[]> {
    const route = '/mango/perp/settle';
    const params: IMangoDEXMarketSettleParams = {
      marketPubkey: marketPubkey.toBase58(),
      ownerPubkey: userKeypair.publicKey.toBase58(),
      mangoAccountNumber: '0',
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'mango.perp.settle',
      'mango',
      'POST',
      route,
      params,
      response.body,
    );

    return deserializeInstructionsAndSigners(response.body);
  }

  async requestInitMarketInstruction(): Promise<instructionsAndSigners[]> {
    const route = '/serum/markets/';
    const params: ISerumDEXMarketInitParams = {
      baseMintPubkey: this.baseMint.publicKey.toBase58(),
      quoteMintPubkey: this.quoteMint.publicKey.toBase58(),
      lotSize: '1',
      tickSize: '1',
      ownerPubkey: this.user1Keypair.publicKey.toBase58(),
    };
    const response = await request(app).post(route).send(params);
    return deserializeInstructionsAndSigners(response.body);
  }

  // --------------------------------------- helpers

  async deposit(mintPubkey: PublicKey, amount: string, userKeypair: Keypair): Promise<void> {
    await this.keeperUpdateAll();
    const transaction = (await this.requestDepositTransactionn(
      mintPubkey,
      amount,
      userKeypair,
    ))[0];
    transaction.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(transaction);
  }

  async withdraw(mintPubkey: PublicKey, amount: string, userKeypair: Keypair, isBorrow: boolean)
  : Promise<void> {
    await this.loadGroup();
    const transaction = (await this.requestWithdrawTransactionn(
      mintPubkey,
      amount,
      userKeypair,
      isBorrow,
    ))[0];
    transaction.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(transaction);
  }

  async placeSpotOrder(
    marketPubkey: PublicKey,
    side: side,
    price: string,
    size: string,
    orderType: orderType,
    userKeypair: Keypair,
  ): Promise<void> {
    await this.loadGroup();
    const transaction = (await this.requestPlaceSpotOrderTransactionn(
      marketPubkey,
      side,
      price,
      size,
      orderType,
      userKeypair,
    ))[0];
    transaction.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(transaction);
  }

  async cancelSpotOrder(
    marketPubkey: PublicKey,
    orderId: string,
    userKeypair: Keypair,
  ): Promise<void> {
    await this.loadGroup();
    const transaction = (await this.requestCancelSpotOrderTransactionn(
      marketPubkey,
      orderId,
      userKeypair,
    ))[0];
    transaction.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(transaction);
  }

  async settleSpot(
    marketPubkey: PublicKey,
    userKeypair: Keypair,
  ): Promise<void> {
    await this.loadGroup();
    const tx = (await this.requestSettleSpotTransactionn(
      marketPubkey,
      userKeypair,
    ))[0];
    tx.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(tx);
  }

  async placePerpOrder(
    marketPubkey: PublicKey,
    side: side,
    price: string,
    size: string,
    orderType: orderType,
    userKeypair: Keypair,
  ): Promise<void> {
    await this.keeperUpdateAll();
    const tx = (await this.requestPlacePerpOrderTxn(
      marketPubkey,
      side,
      price,
      size,
      orderType,
      userKeypair,
    ))[0];
    tx.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(tx);
  }

  async cancelPerpOrder(
    marketPubkey: PublicKey,
    orderId: string,
    userKeypair: Keypair,
  ): Promise<void> {
    await this.keeperUpdateAll();
    const tx = (await this.requestCancelPerpOrderTxn(
      marketPubkey,
      orderId,
      userKeypair,
    ))[0];
    tx.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(tx);
  }

  async settlePerpPnl(
    marketPubkey: PublicKey,
    userKeypair: Keypair,
  ): Promise<void> {
    await this.loadGroup();
    await this.keeperUpdateAll();
    const tx = (await this.requestSettlePerpTransactionn(
      marketPubkey,
      userKeypair,
    ))[0];
    tx.signers.unshift(userKeypair);
    await this._prepareAndSendTransaction(tx);
  }

  async keeperUpdateAll(): Promise<void> {
    await this.loadGroup();
    await this.keeperCrankCache(this.group);
    const perpMarket = await this.loadPerpMarket(this.perpMarketPubkey);
    await this.keeperCrankTransactions(this.group, [perpMarket]);
    await this.keeperConsumeEvents(this.group, [perpMarket]);
  }

  async keeperCrankCache(mangoGroup: MangoGroup): Promise<void> {
    // const updateCacheInterval = 1000;
    // const processKeeperInterval = 15000;
    // const consumeEventsInterval = 2000;

    try {
      const batchSize = 8;
      const promises: Promise<string>[] = [];
      const rootBanks = mangoGroup.tokens
        .map((t) => t.rootBank)
        .filter((t) => !t.equals(zeroKey));
      const oracles = mangoGroup.oracles.filter((o) => !o.equals(zeroKey));
      const perpMarkets = mangoGroup.perpMarkets
        .filter((pm) => !pm.isEmpty())
        .map((pm) => pm.perpMarket);
      for (let i = 0; i < rootBanks.length / batchSize; i += 1) {
        const startIndex = i * batchSize;
        const endIndex = i * batchSize + batchSize;
        const cacheTransaction = new Transaction();
        cacheTransaction.add(
          makeCacheRootBankInstruction(
            MANGO_PROG_ID,
            mangoGroup.publicKey,
            mangoGroup.mangoCache,
            rootBanks.slice(startIndex, endIndex),
          ),
        );
        cacheTransaction.add(
          makeCachePricesInstruction(
            MANGO_PROG_ID,
            mangoGroup.publicKey,
            mangoGroup.mangoCache,
            oracles.slice(startIndex, endIndex),
          ),
        );

        cacheTransaction.add(
          makeCachePerpMarketsInstruction(
            MANGO_PROG_ID,
            mangoGroup.publicKey,
            mangoGroup.mangoCache,
            perpMarkets.slice(startIndex, endIndex),
          ),
        );
        if (cacheTransaction.instructions.length > 0) {
          promises.push(
            this.nativeClient.sendTransaction(
              cacheTransaction, this.user1Keypair as unknown as Account,
              [], undefined, 'confirmed',
            ),
          );
        }
      }

      await Promise.all(promises);
      console.log('Cache updated');
    } catch (err) {
      console.error('Error updating cache', err);
    }
  }

  async keeperCrankTransactions(
    mangoGroup: MangoGroup,
    perpMarkets: PerpMarket[],
  ): Promise<void> {
    try {
      const batchSize = 8;
      const promises: Promise<string>[] = [];

      const filteredPerpMarkets = perpMarkets.filter(
        (pm) => !pm.publicKey.equals(zeroKey),
      );

      for (let i = 0; i < this.config.groups[0].tokens.length / batchSize; i += 1) {
        const startIndex = i * batchSize;
        const endIndex = i * batchSize + batchSize;

        const updateRootBankTransaction = new Transaction();
        this.config.groups[0].tokens.slice(startIndex, endIndex).forEach((token) => {
          updateRootBankTransaction.add(
            makeUpdateRootBankInstruction(
              MANGO_PROG_ID,
              mangoGroup.publicKey,
              mangoGroup.mangoCache,
              token.rootKey,
              token.nodeKeys,
            ),
          );
        });

        const updateFundingTransaction = new Transaction();
        filteredPerpMarkets.slice(startIndex, endIndex).forEach((market) => {
          if (market) {
            updateFundingTransaction.add(
              makeUpdateFundingInstruction(
                MANGO_PROG_ID,
                mangoGroup.publicKey,
                mangoGroup.mangoCache,
                market.publicKey,
                market.bids,
                market.asks,
              ),
            );
          }
        });

        if (updateRootBankTransaction.instructions.length > 0) {
          promises.push(
            this.nativeClient.sendTransaction(
              updateRootBankTransaction, this.user1Keypair as unknown as Account, [],
            ),
          );
        }
        if (updateFundingTransaction.instructions.length > 0) {
          promises.push(
            this.nativeClient.sendTransaction(
              updateFundingTransaction, this.user1Keypair as unknown as Account, [],
            ),
          );
        }
      }
      await Promise.all(promises);
    } catch (err) {
      console.error('Error processing keeper instructions', err);
    }
  }

  async keeperConsumeEvents(mangoGroup: MangoGroup,
    perpMarkets: PerpMarket[],
  ) {
    try {
      const eventQueuePks = perpMarkets.map((mkt) => mkt.eventQueue);
      const eventQueueAccts = await getMultipleAccounts(
        this.connection,
        eventQueuePks,
      );

      const perpMktAndEventQueue = eventQueueAccts.map(
        ({ publicKey, accountInfo }) => {
          const parsed = PerpEventQueueLayout.decode(accountInfo?.data);
          const eventQueue = new PerpEventQueue(parsed);
          const perpMarket = perpMarkets.find((mkt) => mkt.eventQueue.equals(publicKey));
          if (!perpMarket) {
            throw new Error('PerpMarket not found');
          }
          return { perpMarket, eventQueue };
        },
      );

      for (let i = 0; i < perpMktAndEventQueue.length; i += 1) {
        const { perpMarket, eventQueue } = perpMktAndEventQueue[i];

        const events = eventQueue.getUnconsumedEvents();
        if (events.length === 0) {
          // console.log('No events to consume');
          continue;
        }

        const accounts: Set<string> = new Set();
        for (const event of events) {
          if (event.fill) {
            accounts.add(event.fill.maker.toBase58());
            accounts.add(event.fill.taker.toBase58());
          } else if (event.out) {
            accounts.add(event.out.owner.toBase58());
          }

          // Limit unique accounts -> not strictly necessary for local tests
          if (accounts.size >= 10) {
            break;
          }
        }

        await this.nativeClient.consumeEvents(
          this.group,
          perpMarket,
          Array.from(accounts)
            .map((s) => new PublicKey(s))
            .sort(),
          this.user1Keypair as unknown as Account,
          new BN(5),
        );
        console.log(`Consumed up to ${events.length} events`);
      }
    } catch (err) {
      console.error('Error consuming events', err);
    }
  }

  async _consumeEvents(market: Market, mangoOpenOrdersPubkey: PublicKey, payer: Keypair) {
    const openOrders = await market.findOpenOrdersAccountsForOwner(
      this.connection,
      mangoOpenOrdersPubkey,
    );
    const consumeEventsInstruction = market.makeConsumeEventsInstruction(
      openOrders.map((oo) => oo.publicKey), 100,
    );
    const reversedOpenOrdersconsumeEventsInstruction = market.makeConsumeEventsInstruction(
      openOrders.map((oo) => oo.publicKey).reverse(), 100,
    );
    await this._prepareAndSendTransaction({
      instructions: [consumeEventsInstruction],
      signers: [payer],
    });
    await this._prepareAndSendTransaction({
      instructions: [reversedOpenOrdersconsumeEventsInstruction],
      signers: [payer],
    });
  }

  async getMangoTokenBalance(userPubkey: PublicKey, accountIndex: number, tokenIndex: number) {
    await this.loadGroup();
    const mangoAccounts = await this.loadUserAccounts(userPubkey);
    const cache = await this.getCache();
    return mangoAccounts[accountIndex]
      .getNativeDeposit(
        cache.rootBankCache[tokenIndex],
        tokenIndex,
      )
      .toNumber();
  }

  async altGetMangoTokenBalance(userPubkey: PublicKey, accountIndex: number, tokenIndex: number) {
    await this.loadGroup();
    const mangoAccounts = await this.loadUserAccounts(userPubkey);
    const cache = await this.getCache();
    return mangoAccounts[accountIndex]
      .getNet(
        cache.rootBankCache[tokenIndex],
        tokenIndex,
      )
      .toNumber();
  }

  async loadAllOrdersForTestMarket() {
    const market = await Market.load(
      this.connection, this.marketKeypair.publicKey, {}, SERUM_PROG_ID,
    );
    const bids = await market.loadBids(this.connection);
    const asks = await market.loadAsks(this.connection);
    return [...bids, ...asks].filter((order) => order.openOrdersAddress !== undefined);
  }

  async verifyAmount(userPubkey: PublicKey, expectedAmount: number, tokenIndex: number) {
    const amount = await this.getMangoTokenBalance(userPubkey, 0, tokenIndex);
    expect(amount).toBeLessThanOrEqual(expectedAmount + 0.000001);
    expect(amount).toBeGreaterThanOrEqual(expectedAmount - 0.000001);
  }
}
