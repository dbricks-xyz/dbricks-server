import { PublicKey } from '@solana/web3.js';
import { IDEXSettle } from '../../common/interfaces/dex/common.interfaces.dex.settle';
import { ixAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import SerumClient from '../client/serum.client';

class SerumSettleService implements IDEXSettle {
  async settle(market: string, ownerPk: PublicKey): Promise<ixAndSigners> {
    const marketInstance = await SerumClient.loadSerumMarketFromName(market);
    const [
      [ownerBaseIxAndSigners, ownerBasePk],
      [ownerQuoteIxAndSigners, ownerQuotePk],
    ] = await SerumClient.getBaseAndQuoteAccsFromMarket(
      marketInstance,
      market,
      ownerPk,
    );
    const [ixS, signersS] = await SerumClient.prepSettleFundsTx(
      marketInstance,
      ownerPk,
      ownerBasePk,
      ownerQuotePk,
    );
    return [
      [...ownerBaseIxAndSigners[0], ...ownerQuoteIxAndSigners[0], ...ixS],
      [...ownerBaseIxAndSigners[1], ...ownerQuoteIxAndSigners[1], ...signersS],
    ];
  }
}

export default new SerumSettleService();
