import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {Token} from '@solana/spl-token';
import {loadKpSync} from '../../src/common/util/common.util';
import {TESTING_KP_PATH} from '../../src/config/config';
import request from 'supertest';
import app from "../../src/app";
import {
  deserializeIxs,
  deserializeSigners,
  IDEXMarketInit,
  IDEXMarketSettle, IDEXOrderCancel,
  IDEXOrderPlace
} from "dbricks-lib";
import {side,} from '../../src/common/interfaces/dex/common.interfaces.dex.order';
import SolClient from "../../src/common/client/common.client";

export default class SerumTester extends SolClient {
  baseMint!: Token;

  quoteMint!: Token;

  marketKp!: Keypair;

  user1Kp: Keypair;

  user2Kp: Keypair = new Keypair();

  baseUser1Pk!: PublicKey;

  quoteUser1Pk!: PublicKey;

  baseUser2Pk!: PublicKey;

  quoteUser2Pk!: PublicKey;

  constructor() {
    super()
    this.user1Kp = loadKpSync(TESTING_KP_PATH);
  }

  get user1Pk() {
    return this.user1Kp.publicKey;
  }

  get user2Pk() {
    return this.user2Kp.publicKey;
  }

  async prepareAccs() {
    // token mints
    this.baseMint = await this._createMint(this.user1Kp);
    this.quoteMint = await this._createMint(this.user1Kp);

    // user 1 - we give them quote
    this.baseUser1Pk = await this._createTokenAcc(this.baseMint, this.user1Pk);
    this.quoteUser1Pk = await this._createTokenAcc(this.quoteMint, this.user1Pk);
    await this._fundTokenAcc(this.quoteMint, this.user1Pk, this.quoteUser1Pk, 10000);

    // user 2 - we give them base
    //todo temp workaround until figure out airdrops on localnet
    await this._transferLamports(this.user1Kp, this.user2Kp.publicKey, LAMPORTS_PER_SOL);
    this.baseUser2Pk = await this._createTokenAcc(this.baseMint, this.user2Pk);
    this.quoteUser2Pk = await this._createTokenAcc(this.quoteMint, this.user2Pk);
    await this._fundTokenAcc(this.baseMint, this.user1Pk, this.baseUser2Pk, 10000);
  }

  async requestInitMarketIx() {
    const initMarketTx = await request(app).post('/serum/markets/').send({
      baseMintPk: this.baseMint.publicKey.toBase58(),
      quoteMintPk: this.quoteMint.publicKey.toBase58(),
      lotSize: '1',
      tickSize: '1',
      ownerPk: this.user1Pk.toBase58(),
    } as IDEXMarketInit)

    let [initMarketIx, initMarketSigners] = initMarketTx.body;
    initMarketIx = deserializeIxs(initMarketIx);
    initMarketSigners = deserializeSigners(initMarketSigners);

    //the 1st keypair returned is always the marketKp
    this.marketKp = initMarketSigners[0];

    return [initMarketIx, initMarketSigners]
  }

  async requestPlaceOrderIx(
    side: side,
    price: string,
    size: string,
    orderType: string,
    ownerPk: string,
  ) {
    const placeOrderTx = await request(app).post('/serum/orders').send({
      marketPk: this.marketKp.publicKey.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPk,
    } as IDEXOrderPlace).expect(200);

    let [placeOrderIx, placeOrderSigners] = placeOrderTx.body;
    placeOrderIx = deserializeIxs(placeOrderIx);
    placeOrderSigners = deserializeSigners(placeOrderSigners);
    return [placeOrderIx, placeOrderSigners]
  }

  async requestSettleIx(
    ownerPk: string,
  ) {
    const settleTx = await request(app).post('/serum/markets/settle').send({
      marketPk: this.marketKp.publicKey.toBase58(),
      ownerPk,
    } as IDEXMarketSettle).expect(200);

    let [settleIx, settleSigners] = settleTx.body;
    settleIx = deserializeIxs(settleIx);
    settleSigners = deserializeSigners(settleSigners);
    return [settleIx, settleSigners]
  }

  async requestCancelOrderIx(orderId: string, ownerPk: string) {
    const cancelOrderTx = await request(app).post('/serum/orders/cancel').send({
      marketPk: this.marketKp.publicKey.toBase58(),
      orderId,
      ownerPk,
    } as IDEXOrderCancel ).expect(200);

    let [cancelOrderIx, cancelOrderSigners] = cancelOrderTx.body;
    cancelOrderIx = deserializeIxs(cancelOrderIx);
    cancelOrderSigners = deserializeSigners(cancelOrderSigners);
    return [cancelOrderIx, cancelOrderSigners]
  }
}
