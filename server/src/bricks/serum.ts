// import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
// import {Connection, Keypair, PublicKey} from "@solana/web3.js";
// import BN from "bn.js";
// import {Market} from "@project-serum/serum";
//
// async function getTokenAccs(market: Market, connection: Connection, mint: PublicKey, owner: PublicKey) {
//     let tokenAccounts = await market.getTokenAccountsByOwnerForMint(connection, owner, mint);
//     console.log(tokenAccounts[0].pubkey.toBase58());
//     let accs = await connection.getTokenAccountsByOwner(owner, {programId: TOKEN_PROGRAM_ID});
//     accs.value.forEach(a => console.log(a.pubkey.toBase58()));
// }
//
// async function loadSerumMarket(
//     connection: Connection,
//     name: string,
//     network: string,
// ) {
//     let market;
//     if (network === 'devnet') {
//         market = await Market.load(connection, SERUM_SRM_USDC, {}, SERUM_ID);
//     } else if (network === 'mainnet') {
//
//     } else {
//         throw 'Network unrecognized. Should be devnet or mainnet.'
//     }
//
// }
//
// async function getNewOrderV3Ix(
//     connection: Connection,
//     owner: Keypair,
//     market: Market,
// ) {
//
//     const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(connection, owner.publicKey);
//     const ooAcc = openOrdersAccounts[0]
//     const placeOrderIx = market.makePlaceOrderInstruction(connection, {
//         owner: owner as any,
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
//     return placeOrderIx
// }
//
