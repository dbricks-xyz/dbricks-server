import { getMint } from '../../config/config.util';
import MangoClient from './mango.client';

export default class MangoClientTester extends MangoClient {
  constructor() {
    super();
  }

  async getCache() {
    return this.group.loadCache(this.connection);
  }

  getTokenIndex(token: string) {
    const mintAddress = getMint(token);
    return this.group.getTokenIndex(mintAddress);
  }
}
