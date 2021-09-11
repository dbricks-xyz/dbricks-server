import { PublicKey } from '@solana/web3.js';
import { IDEXSettle } from '../../common/interfaces/dex/common.interfaces.dex.settle';
import { ixAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import SolClient from '../../common/client/common.client';
import { getBaseAndQuoteTokenAccs, prepSettleFundsTx } from '../logic/serum.logic.settle';
import { loadSerumMarketFromName } from '../serum.util';

class SerumSettleService implements IDEXSettle {
  async settle(market: string, ownerPk: PublicKey): Promise<ixAndSigners> {
    const marketInstance = await loadSerumMarketFromName(SolClient.connection, market);
    const [
      [ownerBaseIxAndSigners, ownerBasePk],
      [ownerQuoteIxAndSigners, ownerQuotePk],
    ] = await getBaseAndQuoteTokenAccs(
      SolClient.connection,
      marketInstance,
      market,
      ownerPk,
    );
    const [ixS, signersS] = await prepSettleFundsTx(
      SolClient.connection,
      marketInstance,
      ownerPk,
      ownerBasePk,
      ownerQuotePk,
    );
    return [
      [
        ...ownerBaseIxAndSigners[0],
        ...ownerQuoteIxAndSigners[0],
        ...ixS,
      ],
      [...ownerBaseIxAndSigners[1], ...ownerQuoteIxAndSigners[1], ...signersS],
    ];
  }
}

export default new SerumSettleService();
