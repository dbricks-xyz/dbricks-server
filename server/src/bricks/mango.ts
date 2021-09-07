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
