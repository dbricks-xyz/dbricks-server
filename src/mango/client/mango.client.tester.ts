import MangoClient from './mango.client';
import {PublicKey} from "@solana/web3.js";

export default class MangoClientTester extends MangoClient {
  constructor() {
    super();
  }

  async getCache() {
    return this.group.loadCache(this.connection);
  }

  getTokenIndex(mintPk: PublicKey) {
    return this.group.getTokenIndex(mintPk);
  }
}
