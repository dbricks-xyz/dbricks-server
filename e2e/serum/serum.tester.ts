import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {Token} from '@solana/spl-token';
import {loadKpSync} from '../../src/common/util/common.util';
import {TESTING_KP_PATH} from '../../src/config/config';
import request from 'supertest';
import app from "../../src/app";
import {
  deserializeIxsAndSigners,
  ISerumDEXMarketInitParams,
  ISerumDEXMarketSettleParams,
  ISerumDEXOrderCancelParams,
  ISerumDEXOrderPlaceParams,
  side,
} from "dbricks-lib";
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

  async prepAccs() {
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
    const res = await request(app).post('/serum/markets/').send({
      baseMintPk: this.baseMint.publicKey.toBase58(),
      quoteMintPk: this.quoteMint.publicKey.toBase58(),
      lotSize: '1',
      tickSize: '1',
      ownerPk: this.user1Pk.toBase58(),
    } as ISerumDEXMarketInitParams)

    const ixsAndSigners = deserializeIxsAndSigners(res.body);

    //the 1st keypair returned is always the marketKp
    this.marketKp = ixsAndSigners[0].signers[0] as Keypair;
    console.log('New market Pk is', this.marketKp.publicKey.toBase58());

    return ixsAndSigners
  }

  async requestPlaceOrderIx(
    side: side,
    price: string,
    size: string,
    orderType: string,
    ownerPk: string,
  ) {
    const res = await request(app).post('/serum/orders').send({
      marketPk: this.marketKp.publicKey.toBase58(),
      side,
      price,
      size,
      orderType,
      ownerPk,
    } as ISerumDEXOrderPlaceParams).expect(200);
    return deserializeIxsAndSigners(res.body);
  }

  async requestSettleIx(
    ownerPk: string,
  ) {
    const res = await request(app).post('/serum/markets/settle').send({
      marketPk: this.marketKp.publicKey.toBase58(),
      ownerPk,
    } as ISerumDEXMarketSettleParams).expect(200);
    return deserializeIxsAndSigners(res.body);
  }

  async requestCancelOrderIx(orderId: string, ownerPk: string) {
    const res = await request(app).post('/serum/orders/cancel').send({
      marketPk: this.marketKp.publicKey.toBase58(),
      orderId,
      ownerPk,
    } as ISerumDEXOrderCancelParams).expect(200);
    return deserializeIxsAndSigners(res.body);
  }

  async prepMarket() {
    const [tx1, tx2] = await this.requestInitMarketIx();
    tx1.signers.unshift(this.user1Kp);
    tx2.signers.unshift(this.user1Kp);
    await this._prepareAndSendTx(tx1);
    await this._prepareAndSendTx(tx2);
  }
}
