import {
  IDS, MangoAccount, MangoClient as NativeMangoClient, MangoGroup, TokenAccount, TokenAccountLayout,
} from '@blockworks-foundation/mango-client';
import { TokenInstructions } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import debug from 'debug';
import { SolClient } from '../../common/client/common.client';
import { MANGO_PROG_ID } from '../../config/config';
import { getMint } from '../../config/config.util';

const log: debug.IDebugger = debug('app:mango-client');

export class MangoClient extends SolClient {

  nativeClient: NativeMangoClient;

  group!: MangoGroup;

  ownerPk!: PublicKey;

  accounts!: MangoAccount[];

  constructor() {
    super();
    this.nativeClient = new NativeMangoClient(this.connection, MANGO_PROG_ID);
    log('Initialized Mango client');
  }

  async loadGroup() {
    const MANGO_GROUP_NAME = process.env.NETWORK === 'mainnet' ? 'mainnet.1' : 'devnet.1';
    const mangoGroupIds = IDS.groups.find(
      (group) => group.name === MANGO_GROUP_NAME,
    );
    if (!mangoGroupIds) {
      log('Failed to connect to Mango');
      return;
    }
    const mangoGroup = await this.nativeClient.getMangoGroup(new PublicKey(mangoGroupIds.publicKey));
    await mangoGroup.loadRootBanks(this.connection);
    await Promise.all(mangoGroup.rootBankAccounts.map((rootBank) => { return rootBank?.loadNodeBanks(this.connection) } )); // load each nodeBank for all rootBanks
    this.group = mangoGroup;
  }

  async loadAllAccounts() {
    if (!this.ownerPk) return;

    try {
      this.accounts = await this.nativeClient
        .getMangoAccountsForOwner(this.group, this.ownerPk, true);
    } catch (err) {
      log('Could not load Mango margin accounts', err);
    }
  }

  async loadInformation(ownerPk: PublicKey) {
    this.ownerPk = ownerPk;
    await this.loadGroup();
    await this.loadAllAccounts();
  }

  getBanksAndVault(tokenAccount: TokenAccount) {
    const tokenIndex = this.group.getTokenIndex(tokenAccount.mint);
    const { rootBank } = this.group.tokens[tokenIndex];
    const nodeBank = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;
    return [rootBank, nodeBank, vault]
  }


  hasAccounts() {
    return this.accounts.length > 0;
  }

  async getTokenAccount(token: string, ownerPk: PublicKey) {
    const tokenResp = await this.connection.getTokenAccountsByOwner(ownerPk, {
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    });
    const tokenAccounts = tokenResp.value.map(
      ({ pubkey, account }) => new TokenAccount(pubkey, TokenAccountLayout.decode(account.data)),
    );
    const mintAddress = getMint(token);
    const tokenAccount = tokenAccounts.find((acc) => acc.mint.toBase58() === mintAddress.toBase58());
    return tokenAccount;
  }


}

export default new MangoClient();
