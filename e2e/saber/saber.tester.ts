import { Keypair } from "@solana/web3.js";
import SolClient from "../../src/common/client/common.client";
import { loadKpSync } from "../../src/common/util/common.util";
import { TESTING_KP_PATH } from "../../src/config/config";
import {
    deserializeIxsAndSigners,
    ISerumDEXMarketInitParams,
    ISerumDEXMarketSettleParams,
    ISerumDEXOrderCancelParams,
    ISerumDEXOrderPlaceParams,
    side,
  } from "dbricks-lib";

export default class SerumTester extends SolClient {
  user1Kp: Keypair;

  constructor() {
    super();
    this.user1Kp = loadKpSync(TESTING_KP_PATH);
  }

  get user1Pk() {
    return this.user1Kp.publicKey;
  }

  async requestPlaceOrderIx(
    side: side,
    price: string,
    size: string,
    orderType: string,
    ownerPk: string,
  ) {
    // TODO:
    // const res = await request(app).post('/serum/orders').send({
    //   marketPk: this.marketKp.publicKey.toBase58(),
    //   side,
    //   price,
    //   size,
    //   orderType,
    //   ownerPk,
    // } as ISerumDEXOrderPlaceParams).expect(200);
    // return deserializeIxsAndSigners(res.body);
  }
}
