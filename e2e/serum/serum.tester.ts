import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {Token} from '@solana/spl-token';
import {loadKpSync} from '../../src/common/util/common.util';
import {TESTING_KP_PATH} from '../../src/config/config';
import request from 'supertest';
import app from "../../src/app";
import {
  deserializeInstructionsAndSigners,
  ISerumDEXMarketInitParams,
  ISerumDEXMarketSettleParams,
  ISerumDEXOrderCancelParams,
  ISerumDEXOrderPlaceParams,
  side,
  orderType,
} from "dbricks-lib";
import {saveReqResToJSON} from "../../docs/docs.generator";
import SerumClient from "../../src/serum/client/serum.client";
import {Market} from "@project-serum/serum";

export default class SerumTester extends SerumClient {
  baseMint!: Token;

  quoteMint!: Token;

  marketKp!: Keypair;

  market!: Market;

  user1Kp: Keypair;

  user2Kp: Keypair = new Keypair();

  quoteUser1Pk!: PublicKey;

  baseUser2Pk!: PublicKey;

  quoteUser2Pk!: PublicKey;

  constructor() {
    super()
    this.user1Kp = loadKpSync(TESTING_KP_PATH);
  }

  // --------------------------------------- preparators

  async prepAccounts(fundingAmount: number) {
    // token mints
    this.baseMint = await this._createMint(this.user1Kp);
    this.quoteMint = await this._createMint(this.user1Kp);

    // user 1 - we give them quote
    // NOTE: we intentionally are NOT creating the base account for user 1. The BE should take care of that.
    this.quoteUser1Pk = await this._createTokenAcc(this.quoteMint, this.user1Kp.publicKey);
    await this._fundTokenAcc(this.quoteMint, this.user1Kp.publicKey, this.quoteUser1Pk, fundingAmount);

    // user 2 - we give them base
    await this._transferLamports(this.user1Kp, this.user2Kp.publicKey, LAMPORTS_PER_SOL);
    this.baseUser2Pk = await this._createTokenAcc(this.baseMint, this.user2Kp.publicKey);
    this.quoteUser2Pk = await this._createTokenAcc(this.quoteMint, this.user2Kp.publicKey);
    await this._fundTokenAcc(this.baseMint, this.user1Kp.publicKey, this.baseUser2Pk, fundingAmount);
  }

  async prepMarket() {
    const [transaction1, transaction2] = await this.requestInitMarketInstruction();
    transaction1.signers.unshift(this.user1Kp);
    transaction2.signers.unshift(this.user1Kp);
    await this._prepareAndSendTransaction(transaction1);
    await this._prepareAndSendTransaction(transaction2);
    //the 1st keypair returned is always the marketKp
    this.marketKp = transaction1.signers[1] as Keypair;
    console.log('New market Pk is', this.marketKp.publicKey.toBase58());
    this.market = await this.loadSerumMarket(this.marketKp.publicKey);
  }

  // --------------------------------------- requesters

  async requestInitMarketInstruction() {
    const route = '/serum/markets/';
    const params: ISerumDEXMarketInitParams = {
      baseMintPubkey: this.baseMint.publicKey.toBase58(),
      quoteMintPubkey: this.quoteMint.publicKey.toBase58(),
      lotSize: '1',
      tickSize: '1',
      ownerPubkey: this.user1Kp.publicKey.toBase58(),
    };
    const res = await request(app).post(route).send(params);
    saveReqResToJSON(
      'serum.markets.init',
      'serum',
      'POST',
      route,
      params,
      res.body
    );
    return deserializeInstructionsAndSigners(res.body);
  }

  async requestPlaceOrderInstruction(
    side: side,
    price: string,
    size: string,
    orderType: orderType,
    ownerPubkey: string,
  ) {
    const route = '/serum/orders';
    const params: ISerumDEXOrderPlaceParams = {
      marketPubkey: this.marketKp.publicKey.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPubkey,
    };
    const res = await request(app).post(route).send(params).expect(200);
    saveReqResToJSON(
      'serum.orders.place',
      'serum',
      'POST',
      route,
      params,
      res.body
    );
    return deserializeInstructionsAndSigners(res.body);
  }

  async requestSettleInstruction(
    ownerPubkey: string,
  ) {
    const route = '/serum/markets/settle';
    const params: ISerumDEXMarketSettleParams = {
      marketPubkey: this.marketKp.publicKey.toBase58(),
      ownerPubkey,
    };
    const res = await request(app).post(route).send(params).expect(200);
    saveReqResToJSON(
      'serum.markets.settle',
      'serum',
      'POST',
      route,
      params,
      res.body
    );
    return deserializeInstructionsAndSigners(res.body);
  }

  async requestCancelOrderInstruction(orderId: string, ownerPubkey: string) {
    const route = '/serum/orders/cancel';
    const params: ISerumDEXOrderCancelParams = {
      marketPubkey: this.marketKp.publicKey.toBase58(),
      orderId,
      ownerPubkey,
    };
    const res = await request(app).post(route).send(params).expect(200);
    saveReqResToJSON(
      'serum.orders.cancel',
      'serum',
      'POST',
      route,
      params,
      res.body
    );
    return deserializeInstructionsAndSigners(res.body);
  }

  // --------------------------------------- helpers

  async placeLimitOrder(user: Keypair, side: side, amount: number, price: number) {
    const transaction = (await this.requestPlaceOrderInstruction(
      side,
      `${price}`,
      `${amount}`,
      'limit',
      user.publicKey.toBase58(),
    ))[0];
    transaction.signers.unshift(user);
    await this._prepareAndSendTransaction(transaction);
  }

  async cancelOrder(user: Keypair, orderId: string) {
    const cancelTransaction = (await this.requestCancelOrderInstruction(
      orderId,
      user.publicKey.toBase58(),
    ))[0];
    cancelTransaction.signers.unshift(this.user1Kp);
    await this._prepareAndSendTransaction(cancelTransaction);
  }

  async verifyOpenOrdersCount(user: Keypair, orderCount: number) {
    const openOrders = await this.loadOrdersForOwner(this.market, user.publicKey);
    expect(openOrders.length).toEqual(orderCount);
  }

  async settleAndVerifyAmount(user: Keypair, mint: PublicKey, expectedAmount: number) {
    // must consume events for settlement to work
    await this._consumeEvents(this.market, user);
    // settle
    const settleTransaction = (await this.requestSettleInstruction(user.publicKey.toBase58()))[0];
    settleTransaction.signers.unshift(user);
    await this._prepareAndSendTransaction(settleTransaction);
    // verify went through
    const userTokenAccounts = await this.getTokenAccountsForOwner(
      user.publicKey,
      mint,
    );
    expect(userTokenAccounts[0].amount).toEqual(expectedAmount);
  }
}

