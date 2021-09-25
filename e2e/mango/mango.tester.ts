/* eslint-disable no-loop-func */
/* eslint-disable dot-notation */
import request from 'supertest';
import {Cluster, Config, createTokenAccountInstructions, getOracleBySymbol, getPerpMarketByBaseSymbol, getSpotMarketByBaseSymbol, getTokenBySymbol, GroupConfig, makeCachePerpMarketsInstruction, makeCachePricesInstruction, makeCacheRootBankInstruction, makeUpdateRootBankInstruction, MangoGroup, mngoMints, OracleConfig, PerpMarket, RootBank, uiToNative, zeroKey} from '@blockworks-foundation/mango-client';
import * as fs from 'fs';
import {Account, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Market } from '@project-serum/serum';
import { deserializeIxsAndSigners, IMangoDEXOrderCancelParams, IMangoDEXOrderPlaceParams, IMangoLenderDepositParams, IMangoLenderWithdrawParams, ISerumDEXMarketInitParams, orderType, side } from 'dbricks-lib';
import MangoClient from '../../src/mango/client/mango.client';
import app from '../../src/app';
import { loadKpSync } from '../../src/common/util/common.util';
import { TESTING_KP_PATH, SERUM_PROG_ID, MANGO_PROG_ID } from '../../src/config/config';

require('dotenv').config();

export default class MangoTester extends MangoClient {
  MANGO_CONFIG_PATH: string = '/home/dboures/dev/dbricks/dbricks-server/e2e/mango/mangoConfig.json';

  config: Config

  groupName: string = 'localnet.1';

  baseMint!: Token;

  quoteMint!: Token;

  marketKp!: Keypair;

  user1Kp: Keypair;

  user2Kp: Keypair = new Keypair();

  baseUser1Pk!: PublicKey;

  quoteUser1Pk!: PublicKey;

  baseUser2Pk!: PublicKey;

  quoteUser2Pk!: PublicKey;

  user1PayerAccount: Account

  mngoMintPk!: PublicKey

  validInterval: number = 100; // the interval where caches are no longer valid -- see

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
    this.user1Kp = loadKpSync(TESTING_KP_PATH);
    this.user1PayerAccount = new Account(this.user1Kp.secretKey);
    this.config = this.readConfig(this.MANGO_CONFIG_PATH);
  }

  get user1Pk() {
    return this.user1Kp.publicKey;
  }

  get user2Pk() {
    return this.user2Kp.publicKey;
  }

  async getCache() {
    return this.group.loadCache(this.connection);
  }

  getTokenIndex(mintPk: PublicKey) {
    return this.group.getTokenIndex(mintPk);
  }

  // TODO : dedupe
  readConfig(configPath: string) {
    return new Config(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
  }

  writeConfig(configPath: string, config: Config) {
    fs.writeFileSync(configPath, JSON.stringify(config.toJson(), null, 2));
  }

  async setupLocalForTests() {
    // Setup Tokens, Mints, and Serum Markets
    await this.prepAccs();
    await this.prepMarket();
    this.mngoMintPk = (await this._createMint(this.user1Kp)).publicKey;
    // Setup MangoGroup
    const mangoGroupPk = await this.createMangoGroup();

    // add oracles
    await this.addPriceOracle(mangoGroupPk, 'QUOTE');
    await this.addPriceOracle(mangoGroupPk, 'BASE');

    // set oracle prices
    await this.setOraclePrice('QUOTE', 1);
    await this.setOraclePrice('BASE', 1);

    // add spot market
    await this.addSpotMarket('BASE', this.marketKp.publicKey, this.baseMint.publicKey);

    // enable perp market
    // await this.addPerpMarket('BASE');

    // persist mango
    console.log('Mango was set up successfully');
    this.writeConfig(this.MANGO_CONFIG_PATH, this.config);
    console.log('config saved');
  }

  async prepAccs() {
    // token mints
    this.baseMint = await this._createMint(this.user1Kp);
    this.quoteMint = await this._createMint(this.user1Kp);

    // user 1 - we give them quote
    this.baseUser1Pk = await this._createTokenAcc(this.baseMint, this.user1Pk);
    this.quoteUser1Pk = await this._createTokenAcc(this.quoteMint, this.user1Pk);
    await this._fundTokenAcc(this.quoteMint, this.user1Pk, this.quoteUser1Pk, 100000);

    // user 2 - we give them base
    //todo temp workaround until figure out airdrops on localnet
    await this._transferLamports(this.user1Kp, this.user2Kp.publicKey, LAMPORTS_PER_SOL);
    this.baseUser2Pk = await this._createTokenAcc(this.baseMint, this.user2Pk);
    this.quoteUser2Pk = await this._createTokenAcc(this.quoteMint, this.user2Pk);
    await this._fundTokenAcc(this.baseMint, this.user1Pk, this.baseUser2Pk, 100000);
  }

  async prepMarket() {
    const [tx1, tx2] = await this.requestInitMarketIx();
    tx1.signers.unshift(this.user1Kp);
    tx2.signers.unshift(this.user1Kp);
    await this._prepareAndSendTx(tx1);
    await this._prepareAndSendTx(tx2);
  }

  async requestInitMarketIx() {
    const res = await request(app).post('/serum/markets/').send({
      baseMintPk: this.baseMint.publicKey.toBase58(),
      quoteMintPk: this.quoteMint.publicKey.toBase58(),
      lotSize: '1',
      tickSize: '1',
      ownerPk: this.user1Pk.toBase58(),
    } as ISerumDEXMarketInitParams);

    const ixsAndSigners = deserializeIxsAndSigners(res.body);

    // the 1st keypair returned is always the marketKp
    this.marketKp = ixsAndSigners[0].signers[0] as Keypair;
    console.log('New market Pk is', this.marketKp.publicKey.toBase58());

    return ixsAndSigners;
  }

  async initializeFeeVault() {
    const feesVaultAccount = new Account();
    const insuranceVaultAccountInstructions = await createTokenAccountInstructions(
      this.connection,
      this.user1PayerAccount.publicKey,
      feesVaultAccount.publicKey,
      this.quoteMint.publicKey,
      TOKEN_PROGRAM_ID, // owner should be token program
    );

    const createAccountsTransaction = new Transaction();
    createAccountsTransaction.add(...insuranceVaultAccountInstructions);

    const signers = [
      feesVaultAccount,
    ];
    await this.connection.sendTransaction(createAccountsTransaction, [this.user1Kp, ...signers]);
    console.log('Fees vault initialized');
    return feesVaultAccount.publicKey;
  }

  async createMangoGroup() {
    const feesVaultPk = await this.initializeFeeVault();
    const cluster = 'localnet' as Cluster;

    const groupPk = await this.nativeClient.initMangoGroup(
      this.quoteMint.publicKey,
      zeroKey,
      SERUM_PROG_ID,
      feesVaultPk,
      this.validInterval,
      this.optimalUtil,
      this.optimalRate,
      this.maxRate,
      this.user1PayerAccount,
    );
    console.log('Mango Group initialized');
    const group = await this.nativeClient.getMangoGroup(groupPk);
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
      publicKey: groupPk,
      quoteSymbol: 'QUOTE',
      mangoProgramId: MANGO_PROG_ID,
      serumProgramId: SERUM_PROG_ID,
      tokens: [tokenDesc],
      oracles: [],
      perpMarkets: [],
      spotMarkets: [],
    };

    this.config.storeGroup(groupDesc);
    return groupPk;
  }

  async addPriceOracle(mangoGroupPk: PublicKey, symbol: string) {
    await this.nativeClient.addStubOracle(mangoGroupPk, this.user1PayerAccount);
    const group = await this.nativeClient.getMangoGroup(mangoGroupPk);
    const groupConfig = this.config.groups[0];

    const oracle = {
      symbol,
      publicKey: group.oracles[group.numOracles - 1],
    };
    const _oracle = getOracleBySymbol(groupConfig, symbol);
    if (_oracle) {
      Object.assign(_oracle, oracle);
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
      this.user1PayerAccount,
      price,
    );
  }

  // async updatePrices() {
  //   await this.loadGroup();
  //   const cache = await this.getCache();
  //   await this.nativeClient.cachePrices(
  //     this.group.publicKey, cache.publicKey, this.group.oracles, this.user1PayerAccount,
  //   );

  //   const rootBanks = (await this.group.loadRootBanks(this.connection))
  //     .filter((bank) => bank !== undefined) as RootBank[];
  //   const bankPks = rootBanks.map((bank) => bank.publicKey);
  //   await this.nativeClient.cacheRootBanks(
  //     this.group.publicKey, cache.publicKey, bankPks, this.user1PayerAccount,
  //   );

  //   await this.nativeClient.updateRootBank(this.group)
  // }

  async addSpotMarket(
    baseSymbol: string,
    spotMarket: PublicKey,
    baseMint: PublicKey,
  ) {
    const groupConfig = this.config.groups[0];

    let group = await this.nativeClient.getMangoGroup(groupConfig.publicKey);
    const oracleDesc = getOracleBySymbol(groupConfig, baseSymbol) as OracleConfig;

    await this.nativeClient.addSpotMarket(
      group,
      oracleDesc.publicKey,
      spotMarket,
      baseMint,
      this.user1PayerAccount,
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

  // Transaction failed: MangoErrorCode::InvalidVault; src/state.rs:1672
  // Vault might need delegate or close authority?? UnclearS

  // async addPerpMarket(
  //   symbol: string,
  // ) {
  //   const groupConfig = this.config.groups[0];
  //   const makerFee = 0.0;
  //   const takerFee = 0.0005;
  //   const baseLotSize = 100;
  //   const quoteLotSize = 10;
  //   const maxNumEvents = 256;
  //   const rate = 0;
  //   const maxDepthBps = 200;
  //   const targetPeriodLength = 3600;
  //   const mngoPerPeriod = 0;

  //   let group = await this.mangoClient.nativeClient.getMangoGroup(groupConfig.publicKey);
  //   const oracleDesc = getOracleBySymbol(groupConfig, symbol) as OracleConfig;
  //   const marketIndex = group.getOracleIndex(oracleDesc.publicKey);

  //   // Adding perp market
  //   let nativeMngoPerPeriod = 0;
  //   if (rate !== 0) {
  //     const token = getTokenBySymbol(groupConfig, 'MNGO');
  //     if (token === undefined) {
  //       throw new Error('MNGO not found in group config');
  //     } else {
  //       nativeMngoPerPeriod = uiToNative(
  //         mngoPerPeriod,
  //         token.decimals,
  //       ).toNumber();
  //     }
  //   }

  //   await this.mangoClient.nativeClient.addPerpMarket(
  //     group,
  //     oracleDesc.publicKey,
  //     this.mngoMintPk,
  //     this.user1PayerAccount,
  //     this.maintLeverage,
  //     this.initLeverage,
  //     this.liquidationFee,
  //     makerFee,
  //     takerFee,
  //     baseLotSize,
  //     quoteLotSize,
  //     maxNumEvents,
  //     rate,
  //     maxDepthBps,
  //     targetPeriodLength,
  //     nativeMngoPerPeriod,
  //   );

  //   group = await this.mangoClient.nativeClient.getMangoGroup(groupConfig.publicKey);
  //   const marketPk = group.perpMarkets[marketIndex].perpMarket;
  //   const baseDecimals = getTokenBySymbol(groupConfig, symbol)
  //     ?.decimals as number;
  //   const quoteDecimals = getTokenBySymbol(groupConfig, groupConfig.quoteSymbol)
  //     ?.decimals as number;
  //   const market = await this.mangoClient.nativeClient.getPerpMarket(
  //     marketPk,
  //     baseDecimals,
  //     quoteDecimals,
  //   );

  //   const marketDesc = {
  //     name: `${symbol}-PERP`,
  //     publicKey: marketPk,
  //     baseSymbol: symbol,
  //     baseDecimals,
  //     quoteDecimals,
  //     marketIndex,
  //     bidsKey: market.bids,
  //     asksKey: market.asks,
  //     eventsKey: market.eventQueue,
  //   };

  //   const marketConfig = getPerpMarketByBaseSymbol(groupConfig, symbol);
  //   if (marketConfig) {
  //     Object.assign(marketConfig, marketDesc);
  //   } else {
  //     groupConfig.perpMarkets.push(marketDesc);
  //   }

  //   this.config.storeGroup(groupConfig);
  //   console.log(`${symbol}/${groupConfig.quoteSymbol} perp market added`);
  // }

  // async function main() {
  //   if (!groupIds) {
  //     throw new Error(`Group ${groupName} not found`);
  //   }
  //   const mangoGroup = await client.getMangoGroup(mangoGroupKey);
  //   const perpMarkets = await Promise.all(
  //     groupIds.perpMarkets.map((m) => {
  //       return mangoGroup.loadPerpMarket(
  //         connection,
  //         m.marketIndex,
  //         m.baseDecimals,
  //         m.quoteDecimals,
  //       );
  //     }),
  //   );
  
  //   processUpdateCache(mangoGroup);
  //   processKeeperTransactions(mangoGroup, perpMarkets);
  
  //   if (consumeEvents) {
  //     processConsumeEvents(mangoGroup, perpMarkets);
  //   }
  // }

  async keeperUpdateAll() {
    await Promise.all(
      [this.keeperCrankCache(this.group), this.keeperCrankTransactions(this.group, []),
      ],
    );
  }
  
  async keeperCrankCache(mangoGroup: MangoGroup) {
    let lastRootBankCacheUpdate = 0;
    // const updateCacheInterval = 1000;
    const updateRootBankCacheInterval = 5000;
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
      const nowTs = Date.now();
      let shouldUpdateRootBankCache = false;
      if (nowTs - lastRootBankCacheUpdate > updateRootBankCacheInterval) {
        shouldUpdateRootBankCache = true;
        lastRootBankCacheUpdate = nowTs;
      }
      for (let i = 0; i < rootBanks.length / batchSize; i += 1) {
        const startIndex = i * batchSize;
        const endIndex = i * batchSize + batchSize;
        const cacheTransaction = new Transaction();
        if (shouldUpdateRootBankCache) {
          cacheTransaction.add(
            makeCacheRootBankInstruction(
              MANGO_PROG_ID,
              mangoGroup.publicKey,
              mangoGroup.mangoCache,
              rootBanks.slice(startIndex, endIndex),
            ),
          );
        }
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
            this.nativeClient.sendTransaction(cacheTransaction, this.user1PayerAccount,
              []),
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
  ) {
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

        // const updateFundingTransaction = new Transaction();
        // filteredPerpMarkets.slice(startIndex, endIndex).forEach((market) => {
        //   if (market) {
        //     updateFundingTransaction.add(
        //       makeUpdateFundingInstruction(
        //         mangoProgramId,
        //         mangoGroup.publicKey,
        //         mangoGroup.mangoCache,
        //         market.publicKey,
        //         market.bids,
        //         market.asks,
        //       ),
        //     );
        //   }
        // });

        if (updateRootBankTransaction.instructions.length > 0) {
          promises.push(
            this.nativeClient.sendTransaction(
              updateRootBankTransaction, this.user1PayerAccount, [],
            ),
          );
        }
        // if (updateFundingTransaction.instructions.length > 0) {
        //   promises.push(
        //     client.sendTransaction(updateFundingTransaction, payer, []),
        //   );
        // }
      }
      await Promise.all(promises);
    } catch (err) {
      console.error('Error processing keeper instructions', err);
    }
  }

  async getTokenAmount(userPk: PublicKey, accIndex: number, tokenIndex: number) {
    await this.loadGroup();
    const mangoAccs = await this.loadUserAccounts(userPk);
    const cache = await this.getCache();
    return mangoAccs[accIndex]
      .getNativeDeposit(
        cache.rootBankCache[tokenIndex],
        tokenIndex,
      )
      .toNumber();
  }

  async depositTxn(mintPk: PublicKey, amount: string, userKp: Keypair) {
    await this.keeperUpdateAll();
    const res = await request(app).post('/mango/deposit').send({
      mintPk: mintPk.toBase58(),
      quantity: amount,
      ownerPk: userKp.publicKey.toBase58(),
      mangoAccNr: '0',
    } as IMangoLenderDepositParams).expect(200);

    await this.signAndSend(res, userKp);
  }

  async withdrawTxn(mintPk: PublicKey, amount: string, userKp: Keypair, isBorrow: boolean) {
    await this.keeperUpdateAll();
    const res = await request(app).post('/mango/withdraw').send({
      mintPk: mintPk.toBase58(),
      quantity: amount,
      isBorrow,
      ownerPk: userKp.publicKey.toBase58(),
      mangoAccNr: '0',
    } as IMangoLenderWithdrawParams).expect(200);

    await this.signAndSend(res, userKp);
  }

  async placeSpotOrderTxn(
    marketPk: PublicKey,
    side: side,
    price: string,
    size: string,
    orderType: orderType,
    userKp: Keypair,
  ) {
    await this.keeperUpdateAll();
    const res = await request(app).post('/mango/spot/place').send({
      marketPk: marketPk.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPk: userKp.publicKey.toBase58(),
      mangoAccNr: '0',
    } as IMangoDEXOrderPlaceParams).expect(200);

    await this.signAndSend(res, userKp);
  }

  async placeCancelOrderTxn(
    marketPk: PublicKey,
    orderId: string,
    userKp: Keypair,
  ) {
    await this.keeperUpdateAll();
    const res = await request(app).post('/mango/spot/cancel').send({
      marketPk: marketPk.toBase58(),
      orderId,
      ownerPk: userKp.publicKey.toBase58(),
      mangoAccNr: '0',
    } as IMangoDEXOrderCancelParams).expect(200);

    await this.signAndSend(res, userKp);
  }

  async signAndSend(res: request.Response, signerKp: Keypair) {
    const tx = deserializeIxsAndSigners(res.body)[0];
    tx.signers.unshift(signerKp);
    await this._prepareAndSendTx(tx);
  }
}
