import axios from 'axios';
import { getConnection, prepareAndSendTx } from './fakeFrontEnd';
import { ownerKp } from './keypair';

async function mangoTest() {
  // const accounts = await axios.get('http://localhost:3000/mango/accounts');
  // console.log(accounts.data);


  await getConnection();

  const depositTx = await axios.post('http://localhost:3000/mango/deposit', {
    walletPk: 'BXLtyWtzuDiC5Y9AXEvayr47XMRcM5oQ7Na5Cmyd1Ewd',
    mangoPk: '9rwTvLv4AbYbx5ybpS2NJTt48ayZ3SKe3bwMjyhwozpR',
    tokenMintPk: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC authority is 2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9
    quantity: 1,
  });
  const [depositIx, depositSigners] = depositTx.data;

  // execute both together
  const hash = await prepareAndSendTx(
    [...depositIx],
    [ownerKp, ...depositSigners],
  );
  console.log(hash);
}

mangoTest();
