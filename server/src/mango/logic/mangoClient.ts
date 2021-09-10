import {
  IDS, MangoAccount, MangoClient, MangoGroup,
} from '@blockworks-foundation/mango-client';
import { Connection, PublicKey } from '@solana/web3.js';
import debug from 'debug';
import SolClient from '../../common/logic/client';
import { MANGO_PROG_ID } from '../../constants/constants';
import { MangoRoutes } from '../routes/mango.routes';

//const log: debug.IDebugger = debug('app:sol-client');

class MangoInformation {
  connection: Connection;

  client: MangoClient;

  group: MangoGroup;

  walletPk: PublicKey;

  accounts: MangoAccount[];

  constructor(connection: Connection, walletPk: PublicKey) {
    this.walletPk = walletPk;
    this.connection = connection;
    this.client = new MangoClient(connection, MANGO_PROG_ID);
  }

  async loadGroup() {
    const MANGO_GROUP_NAME = process.env.NETWORK === 'mainnet' ? 'mainnet.1' : 'devnet.1';
    const mangoGroupIds = IDS.groups.find(
      (group) => group.name === MANGO_GROUP_NAME,
    );
    if (!mangoGroupIds) {
      console.log('Failed to connect to Mango');
      return;
    }
    const mangoGroup = await this.client.getMangoGroup(new PublicKey(mangoGroupIds.publicKey));
    await mangoGroup.loadRootBanks(this.connection);
    this.group = mangoGroup;
  }

  async loadAccounts() {
    if (!this.walletPk) return;

    try {
      this.accounts = await this.client
        .getMangoAccountsForOwner(this.group, this.walletPk, true);
    } catch (err) {
      console.log('Could not load Mango margin accounts', err);
    }
  }
}

export default new MangoInformation(SolClient.connection, new PublicKey('DAETLz1E6ThdzRYqx131swWGLqzA4UjyPC3M7nTvSQve')); // user will need to make one of these objects on the FE?
