import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {Token} from '@solana/spl-token';
import {loadKeypairSync} from '../../src/common/util/common.util';
import {TESTING_KEYPAIR_PATH} from '../../src/config/config';
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
import {saveRequestResponseToJSON} from "../../docs/docs.generator";
import SerumClient from "../../src/serum/client/serum.client";
import {Market} from "@project-serum/serum";

export default class SerumTester extends SerumClient {
  baseMint!: Token;

  quoteMint!: Token;

  marketKeypair!: Keypair;

  market!: Market;

  user1Keypair: Keypair;

  user2Keypair: Keypair = new Keypair();

  quoteUser1Pubkey!: PublicKey;

  baseUser2Pubkey!: PublicKey;

  quoteUser2Pubkey!: PublicKey;

  constructor() {
    super()
    this.user1Keypair = loadKeypairSync(TESTING_KEYPAIR_PATH);
  }

  // --------------------------------------- preparators

  async prepareAccounts(fundingAmount: number) {
    // token mints
    this.baseMint = await this._createMint(this.user1Keypair);
    this.quoteMint = await this._createMint(this.user1Keypair);

    // user 1 - we give them quote
    // NOTE: we intentionally are NOT creating the base account for user 1. The BE should take care of that.
    this.quoteUser1Pubkey = await this._createTokenAccount(this.quoteMint, this.user1Keypair.publicKey);
    await this._fundTokenAccount(this.quoteMint, this.user1Keypair.publicKey, this.quoteUser1Pubkey, fundingAmount);

    // user 2 - we give them base
    await this._transferLamports(this.user1Keypair, this.user2Keypair.publicKey, LAMPORTS_PER_SOL);
    this.baseUser2Pubkey = await this._createTokenAccount(this.baseMint, this.user2Keypair.publicKey);
    this.quoteUser2Pubkey = await this._createTokenAccount(this.quoteMint, this.user2Keypair.publicKey);
    await this._fundTokenAccount(this.baseMint, this.user1Keypair.publicKey, this.baseUser2Pubkey, fundingAmount);
  }

  async prepareMarket() {
    const [transaction1, transaction2] = await this.requestInitMarketInstruction();
    transaction1.signers.unshift(this.user1Keypair);
    transaction2.signers.unshift(this.user1Keypair);
    await this._prepareAndSendTransaction(transaction1);
    await this._prepareAndSendTransaction(transaction2);
    //the 1st keypair returned is always the marketKp
    this.marketKeypair = transaction1.signers[1] as Keypair;
    console.log('New market Pubkey is', this.marketKeypair.publicKey.toBase58());
    this.market = await this.loadSerumMarket(this.marketKeypair.publicKey);
  }

  // --------------------------------------- requesters

  async requestInitMarketInstruction() {
    const route = '/serum/markets/';
    const params: ISerumDEXMarketInitParams = {
      baseMintPubkey: this.baseMint.publicKey.toBase58(),
      quoteMintPubkey: this.quoteMint.publicKey.toBase58(),
      lotSize: '1',
      tickSize: '1',
      ownerPubkey: this.user1Keypair.publicKey.toBase58(),
    };
    const response = await request(app).post(route).send(params);
    saveRequestResponseToJSON(
      'serum.markets.init',
      'serum',
      'POST',
      route,
      params,
      response.body
    );
    return deserializeInstructionsAndSigners(response.body);
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
      marketPubkey: this.marketKeypair.publicKey.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPubkey,
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'serum.orders.place',
      'serum',
      'POST',
      route,
      params,
      response.body
    );
    return deserializeInstructionsAndSigners(response.body);
  }

  async requestSettleInstruction(
    ownerPubkey: string,
  ) {
    const route = '/serum/markets/settle';
    const params: ISerumDEXMarketSettleParams = {
      marketPubkey: this.marketKeypair.publicKey.toBase58(),
      ownerPubkey,
    };
    const response = await request(app).post(route).send(params).expect(200);
    saveRequestResponseToJSON(
      'serum.markets.settle',
      'serum',
      'POST',
      route,
      params,
      response.body
    );
    return deserializeInstructionsAndSigners(response.body);
  }

  async requestCancelOrderInstruction(orderId: string, ownerPubkey: string, saveRes = true) {
    const route = '/serum/orders/cancel';
    const params: ISerumDEXOrderCancelParams = {
      marketPubkey: this.marketKeypair.publicKey.toBase58(),
      orderId,
      ownerPubkey,
    };
    const response = await request(app).post(route).send(params).expect(200);
    if (saveRes) {
      saveRequestResponseToJSON(
        'serum.orders.cancel',
        'serum',
        'POST',
        route,
        params,
        response.body
      );
    }
    return deserializeInstructionsAndSigners(response.body);
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

  async cancelOrder(user: Keypair, orderId: string, saveRes=true) {
    const cancelTransaction = (await this.requestCancelOrderInstruction(
      orderId,
      user.publicKey.toBase58(),
      saveRes,
    ))[0];
    cancelTransaction.signers.unshift(this.user1Keypair);
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

