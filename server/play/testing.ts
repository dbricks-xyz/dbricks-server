import axios from 'axios';
import { deserializeIx, getConnection, prepareAndSendTx } from './fakeFrontEnd';
import { ownerKp } from './keypair';

async function mangoTest() {
  // const accounts = await axios.get('http://localhost:3000/mango/accounts');
  // console.log(accounts.data);

  const depositTx = await axios.post('http://localhost:3000/mango/deposit', {
    walletPk: 'DAETLz1E6ThdzRYqx131swWGLqzA4UjyPC3M7nTvSQve',
    mangoPk: 'DAETLz1E6ThdzRYqx131swWGLqzA4UjyPC3M7nTvSQve',
    tokenMintPk: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC authority is 2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9
    quantity: 1,
  });
  const [depositIx, depositSigners] = depositTx.data;
  deserializeIx(depositIx);

  // execute both together
  await getConnection();
  const hash = await prepareAndSendTx(
    [...depositIx],
    [ownerKp, ...depositSigners],
  );
  console.log(hash);
}

mangoTest();
