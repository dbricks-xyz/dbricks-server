// import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// import { assert, fail } from '../../common/util/common.util';
// import MangoClientTester from './mango.client.tester';

// describe('Mango', () => { // Tests require SOL
//   it('Can load mangoAccounts', async () => {
//     const mangoTester = new MangoClientTester();

//       assert(userAccounts.length > 0);
//     });

//   it('Can deposit and create a mangoAccount', async () => {
//     const mangoTester = new MangoClientTester();

//     const newAcc = await mangoTester._newAccountWithLamports(LAMPORTS_PER_SOL * 10);
//     const newKp = Keypair.fromSecretKey(new Uint8Array(newAcc.secretKey));

//     await mangoTester.initMangoAccountAndDeposit('SOL', 5, newKp);

//     const userAccounts = await mangoTester.loadUserAccounts(newKp.publicKey);

//     assert(userAccounts.length > 0);
//   });
// });
