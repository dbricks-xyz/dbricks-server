// import {Token, TOKEN_PROGRAM_ID, u64} from "@solana/spl-token";
// import {
//     Account, Commitment,
//     Connection,
//     Keypair,
//     LAMPORTS_PER_SOL,
//     PublicKey,
//     sendAndConfirmTransaction,
//     Signer,
//     SystemProgram,
//     SYSVAR_RENT_PUBKEY,
//     Transaction,
//     TransactionInstruction
// } from "@solana/web3.js";
// import BN from "bn.js";
// import * as borsh from 'borsh';
// import fs from 'fs'
// import {DexInstructions, Market} from "@project-serum/serum";
// import {
//     Config, getMarketByBaseSymbolAndKind,
//     GroupConfig,
//     MangoClient
// } from "@blockworks-foundation/mango-client";
// import configFile from './ids.json';
// import {SWAP_PROGRAM_ID, swapInstruction} from "@saberhq/stableswap-sdk";
//
// // ============================================================================= globals & consts
// let connection: Connection;
// let market: Market;
//
// const SERUM_ID = new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");
// const SERUM_SOL_USDC = new PublicKey("9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT");
// const SERUM_SRM_USDC = new PublicKey("ByRys5tuUWDgL73G8JBAEfkdFf8JWBzPBDHsBVQ5vbQA");
// const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
// const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
// const SRM_MINT = new PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt");
// const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
//
// const MANGO_ID = new PublicKey("5fNfvyp5czQVX77yoACa3JJVEhdRaWjPuazuWgjhTqEH");
// const SABER_ID = new PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
//
// const secretKey = JSON.parse(fs.readFileSync('/Users/ilmoi/.config/solana/id.json', 'utf8'));
// const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));
// const payerAcc = new Account(Uint8Array.from(secretKey));
// let payerUSDC = new PublicKey("E1trhd2juz39n6kQ1eLR5j6QCkSQk6UY1GL9EnUYKdSz");
// let payerSRM = new PublicKey("4JAWe2S5TYTAzoEz66PJdANfB3T22Ais92BrnSPtvh3X");
// let payerUSDT = new PublicKey("CZw4hjxANmmdSzNpYgNnaZujm3CGejd9irhsUK3kQ2JD");
//
// // ============================================================================= helpers
//
// async function getConnection() {
//     const url = 'https://solana-api.projectserum.com';
//     connection = new Connection(url);
//     const version = await connection.getVersion();
//     console.log('connection to cluster established:', url, version);
// }
//
// async function prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
//     const tx = new Transaction().add(...instructions);
//     const sig = await sendAndConfirmTransaction(connection, tx, signers);
//     console.log(sig);
// }
//
// // ============================================================================= serum
//
// async function getTokenAccs() {
//     let payerBase = await market.findBaseTokenAccountsForOwner(connection, payer.publicKey, true);
//     console.log(payerBase[0].pubkey.toBase58());
//     let payerUSDC = await market.getTokenAccountsByOwnerForMint(connection, payer.publicKey, USDC_MINT);
//     console.log('usdc:', payerUSDC[0].pubkey.toBase58());
//     let payerSRM = await market.getTokenAccountsByOwnerForMint(connection, payer.publicKey, SRM_MINT);
//     console.log('srm:', payerSRM[0].pubkey.toBase58());
//     let payerUSDT = await market.getTokenAccountsByOwnerForMint(connection, payer.publicKey, USDT_MINT);
//     console.log('usdt:', payerUSDT[0].pubkey.toBase58());
//     // let accs = await connection.getTokenAccountsByOwner(payer.publicKey, {programId: TOKEN_PROGRAM_ID});
//     // accs.value.forEach(a => console.log(a.pubkey.toBase58()));
// }
//
// async function tradeAndSettle() {
//     //trade
//     const sign = await market.placeOrder(connection, {
//         owner: payer as any,
//         payer: payer.publicKey,
//         side: 'sell',
//         price: 100,
//         size: 0.1,
//         orderType: 'ioc',
//     })
//     console.log("serum trade successful,", sign);
//
//     //settle
//     for (let openOrders of await market.findOpenOrdersAccountsForOwner(
//         connection,
//         payer.publicKey,
//     )) {
//         if (openOrders.baseTokenFree > new BN(0) || openOrders.quoteTokenFree > new BN(0)) {
//             // spl-token accounts to which to send the proceeds from trades
//             let baseTokenAccount = payer.publicKey;
//             let quoteTokenAccount = payerUSDC;
//
//             await market.settleFunds(
//                 connection,
//                 payer as any,
//                 openOrders,
//                 baseTokenAccount,
//                 quoteTokenAccount,
//             );
//         }
//     }
//     console.log('usdc funds settled')
// }
//
// async function tradeAndSettleManual() {
//     const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(connection, payer.publicKey);
//     const ooAcc = openOrdersAccounts[0]
//     const placeOrderIx = market.makePlaceOrderInstruction(connection, {
//         owner: payer as any,
//         payer: payerSRM,
//         side: 'sell',
//         price: 5,
//         size: 0.1,
//         orderType: 'ioc',
//         clientId: undefined,
//         openOrdersAddressKey: ooAcc.address,
//         feeDiscountPubkey: null,
//         selfTradeBehavior: 'decrementTake',
//     });
//     // const settleIx = DexInstructions.settleFunds({
//     //     market: market.address,
//     //     openOrders: ooAddr,
//     //     owner: ooAcc.owner,
//     //     baseVault: x,
//     //     quoteVault: y,
//     // })
//     const {transaction, signers} = await market.makeSettleFundsTransaction(
//         connection,
//         ooAcc,
//         payerSRM,
//         payerUSDC,
//     )
//     const settleFundsIx = transaction.instructions[0];
//     // await prepareAndSendTx(
//     //     [placeOrderIx, settleFundsIx],
//     //     [payer]
//     // );
//     return [placeOrderIx, settleFundsIx]
// }
//
// // ============================================================================= mango
//
// async function mangoOrder() {
//     const config = new Config(configFile);
//     const groupConfig = config.getGroup(
//         'mainnet',
//         'mainnet.1',
//     ) as GroupConfig;
//     const client = new MangoClient(connection, groupConfig.mangoProgramId);
//
//     // load group & market
//     const spotMarketConfig = getMarketByBaseSymbolAndKind(
//         groupConfig,
//         'BTC',
//         'spot',
//     );
//     const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);
//     const spotMarket = await Market.load(
//         connection,
//         spotMarketConfig.publicKey,
//         undefined,
//         groupConfig.serumProgramId,
//     );
//
//     // // Fetch orderbooks
//     // const bids = await spotMarket.loadBids(connection);
//     // const asks = await spotMarket.loadAsks(connection);
//     //
//     // // L2 orderbook data
//     // for (const [price, size] of bids.getL2(20)) {
//     //     console.log(price, size);
//     // }
//     //
//     // // L3 orderbook data
//     // for (const order of asks) {
//     //     console.log(
//     //         order.openOrdersAddress.toBase58(),
//     //         order.orderId.toString('hex'),
//     //         order.price,
//     //         order.size,
//     //         order.side, // 'buy' or 'sell'
//     //     );
//     // }
//
//     // Place order
//     const mangoAccount = (
//         await client.getMangoAccountsForOwner(mangoGroup, payer.publicKey)
//     )[0];
//     console.log(mangoAccount)
//     await client.placeSpotOrder(
//         mangoGroup,
//         mangoAccount,
//         mangoGroup.mangoCache,
//         spotMarket as any,
//         payer as any,
//         'buy', // or 'sell'
//         61000,
//         0.0001,
//         'ioc',
//     ); // or 'ioc' or 'postOnly'
// }
//
// // ============================================================================= saber
//
// async function performSwap() {
//     const config = {
//         swapAccount: new PublicKey("YAkoNb6HKmSxQN9L8hiBE5tPJRsniSSMzND1boHmZxe"),
//         authority: new PublicKey("5C1k9yV7y4CjMnKv8eGYDgWND8P89Pdfj79Trk2qmfGo"),
//         swapProgramID: SWAP_PROGRAM_ID,
//         tokenProgramID: TOKEN_PROGRAM_ID,
//     };
//     const userAuthority = payer.publicKey;
//     const userSource = payerUSDC;
//     const poolSource = new PublicKey("CfWX7o2TswwbxusJ4hCaPobu2jLCb1hfXuXJQjVq3jQF");
//     const poolDestination = new PublicKey("EnTrdMMpdhugeH6Ban6gYZWXughWxKtVGfCwFn78ZmY3");
//     const userDestination = payerUSDT;
//     const adminDestination = new PublicKey("2SL8iP8EjnUr6qTkbkfZt9tauXwJgc4GKXkYCCbLGbVP");
//     const amountIn = new u64(1000000);
//     const minimumAmountOut = new u64(1);
//     const swapIx = swapInstruction({
//         config,
//         userAuthority,
//         userSource,
//         poolSource,
//         poolDestination,
//         userDestination,
//         adminDestination,
//         amountIn,
//         minimumAmountOut,
//     })
//     // await prepareAndSendTx(
//     //     [swapIx],
//     //     [payer]
//     // )
//     return swapIx
// }
//
//
// // ============================================================================= play
//
// async function play() {
//     await getConnection();
//     market = await Market.load(connection, SERUM_SRM_USDC, {}, SERUM_ID);
//     // await getTokenAccs();
//     // await tradeAndSettle();
//     let serumIx = await tradeAndSettleManual();
//     let swapIx = await performSwap();
//     let totalIx = [...serumIx, swapIx];
//     await prepareAndSendTx(
//         totalIx,
//         [payer]
//     )
//
// }
//
// play()
