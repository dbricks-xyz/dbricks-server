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
