import axios from 'axios';
import SolClient from '../src/common/client/common.client';
import { deserializeIxs, deserializeSigners } from '../src/common/util/common.serializers';
import { loadKpSync } from '../src/common/util/common.util';
import { TESTING_KP_PATH } from '../src/config/config';

async function mangoTest() {

  // There's 2 ways to test deposit
  // Either you're depositing to an already existing Mango account (use destinationPk)
  // Or you have to create a mangoAccount as well (comment out destinationPk and make sure the keypair you're useing does not have any mangoAccounts) -> Devnet tests will be in next commit
  // Also FYI creating a MangoAccount is way more expensive than a normal txn (.03 SOL) bc there's a lot of data associated with a mangoAccount
  const depositTx = await axios.post('http://localhost:3000/mango/deposit', {
    token: 'USDC',
    quantity: 1,
    ownerPk: '8vKJN4iDmx6EcNQjZc9K857uLExs3LzWPVF6SoyBhtzq', // Will come from wallet
    //destinationPk: '9rwTvLv4AbYbx5ybpS2NJTt48ayZ3SKe3bwMjyhwozpR', // will come from UI via mangoclient.loadUserAccounts
  });
  let [depositIx, depositSigners] = depositTx.data;
  depositIx = deserializeIxs(depositIx);
  depositSigners = deserializeSigners(depositSigners);
  const ownerKp = loadKpSync(TESTING_KP_PATH);

  // execute tx
  await SolClient.prepareAndSendTx(
    [
      ...depositIx,
    ],
    [
      ownerKp,
      ...depositSigners,
    ],
  );

  // const withdrawTx = await axios.post('http://localhost:3000/mango/withdraw', {
  //   token: 'USDC',
  //   quantity: 1,
  //   ownerPk: 'BXLtyWtzuDiC5Y9AXEvayr47XMRcM5oQ7Na5Cmyd1Ewd', // Will come from wallet
  //   sourcePk: '9rwTvLv4AbYbx5ybpS2NJTt48ayZ3SKe3bwMjyhwozpR', // will come from UI via mangoclient.loadUserAccounts
  // });

  // let [withdrawIx, withdrawSigners] = withdrawTx.data;
  // withdrawIx = deserializeIxs(withdrawIx);
  // withdrawSigners = deserializeSigners(withdrawSigners);
  //  const ownerKp = loadKpSync(TESTING_KP_PATH);

  // // execute tx
  // await SolClient.prepareAndSendTx(
  //   [
  //     ...withdrawIx,
  //   ],
  //   [
  //     ownerKp,
  //     ...withdrawSigners,
  //   ],
  // );
}

mangoTest();
