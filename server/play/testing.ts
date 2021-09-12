import axios from 'axios';
import SolClient from '../src/common/client/common.client';
import { deserializeIxs, deserializeSigners } from '../src/common/util/common.serializers';
import { loadKpSync } from '../src/common/util/common.util';
import { TESTING_KP_PATH } from '../src/config/config';

async function mangoTest() { // TODO: works but throws an error??? Error: No instructions ?? 

  const depositTx = await axios.post('http://localhost:3000/mango/deposit', {
    token: 'USDC',
    quantity: 1,
    ownerPk: 'BXLtyWtzuDiC5Y9AXEvayr47XMRcM5oQ7Na5Cmyd1Ewd',
    destinationPk: '9rwTvLv4AbYbx5ybpS2NJTt48ayZ3SKe3bwMjyhwozpR',
  });
  let [depositIx, depositSigners] = depositTx.data;
  depositIx = deserializeIxs(depositIx);
  depositSigners = deserializeSigners(depositSigners);
  console.log(depositTx.data)
  console.log(depositIx);

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
}

mangoTest();
