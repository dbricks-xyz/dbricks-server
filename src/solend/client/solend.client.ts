import SolClient from "../../common/client/common.client";
import debug from "debug";

const log: debug.IDebugger = debug('app:solend-client');

export default class SolendClient extends SolClient {
  constructor() {
    super();
    log('Initialized Solend client')
  }

  async prepareDepositTransaction() {
    console.log('deposit')
  }

  async prepareWithdrawTransaction() {
    console.log('withdraw')
  }
}