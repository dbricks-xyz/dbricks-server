import {
  IDS, MangoAccount, MangoClient, MangoGroup,
} from '@blockworks-foundation/mango-client';
import { Connection, PublicKey } from '@solana/web3.js';
import { MANGO_PROG_ID } from '../../constants/constants';

export async function getMangoClient(connection: Connection): Promise<MangoClient> {
  return new MangoClient(connection, MANGO_PROG_ID);
}

export async function getMangoGroup(mangoClient: MangoClient): Promise<MangoGroup | undefined> {
  const MANGO_GROUP_NAME = process.env.NETWORK === 'mainnet' ? 'mainnet.1' : 'devnet.1';
  const mangoGroupIds = IDS.groups.find(
    (group) => group.name === MANGO_GROUP_NAME,
  );
  if (!mangoGroupIds) {
    console.log('Failed to connect to Mango');
    return;
  }
  return mangoClient.getMangoGroup(new PublicKey(mangoGroupIds.publicKey));
}


export async function fetchMangoAccounts(mangoClient: MangoClient, mangoGroup: MangoGroup, walletPk: PublicKey) {
  if (!walletPk) return;

  return mangoClient
    .getMangoAccountsForOwner(mangoGroup, walletPk, true)
    .then((mangoAccounts) => {
      if (mangoAccounts.length > 0) {
        const sortedAccounts = mangoAccounts
          .slice()
          .sort((a, b) => (a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1));
        return sortedAccounts;
      }
    }).catch((err) => {
      console.log('Could not load Mango margin accounts', err);
    });
}
