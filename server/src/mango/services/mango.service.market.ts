// import { PublicKey } from '@solana/web3.js';
// import debug from 'debug';
// import { IDEXMarket } from '../../common/interfaces/dex/common.interfaces.dex.market';
// import { ixsAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
// import { MangoClient } from '../client/mango.client';

// const log: debug.IDebugger = debug('app:mango-market-service');
// // implements IDEXMarket but not init?
// export default class MangoMarketService extends MangoClient {
//   async settle(ownerPk: PublicKey, mangoPk: PublicKey): Promise<ixsAndSigners> {
//     const userAccounts = await this.loadUserAccounts(ownerPk);
//     const userAccount = userAccounts.find((acc) => acc.publicKey.toBase58() === mangoPk.toBase58());
//     if (!userAccount) {
//       log(
//         `Could not find ${mangoPk.toBase58()} in mangoAccounts owned by ${ownerPk.toBase58()}`,
//       );
//       return [[], []];
//     }
//     const markets = await this.loadSpotMarkets();

//     return this.prepSettleSpotTx(
//       this.group,
//       userAccount,
//       markets,
//       ownerPk,
//     );
//   }
// }
