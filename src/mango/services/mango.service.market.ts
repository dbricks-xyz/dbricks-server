import {ixsAndSigners} from 'dbricks-lib';
import {QUOTE_INDEX} from '@blockworks-foundation/mango-client';
import {IMangoDEXMarket} from '../interfaces/dex/mango.interfaces.dex.market';
import MangoClient from '../client/mango.client';
import {ISerumDEXMarketSettleParamsParsed} from "../../serum/interfaces/dex/serum.interfaces.dex.market";

export default class MangoMarketService extends MangoClient implements IMangoDEXMarket {
  async settleSpot(params: ISerumDEXMarketSettleParamsParsed): Promise<ixsAndSigners[]> {
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk);
    const markets = await this.loadSpotMarkets();

    const tx = await this.prepSettleSpotTx(
      mangoAcc,
      markets,
      params.ownerPk,
    );
    return [tx];
  }

  async settlePerp(params: ISerumDEXMarketSettleParamsParsed): Promise<ixsAndSigners[]> {
    await this.loadGroup();
    const mangoAcc = await this.loadMangoAccForOwner(params.ownerPk);
    const perpMarket = await this.loadPerpMarket(params.marketPk);
    const marketIndex = this.group.getPerpMarketIndex(perpMarket.publicKey);
    const mangoCache = await this.group.loadCache(this.connection);
    const quoteRootBank = this.group.rootBankAccounts[QUOTE_INDEX];
    if (!quoteRootBank) {
      throw new Error('Error finding rootBankAccount for mangoGroup');
    }

    const tx = await this.prepSettlePerpTx(
      mangoCache,
      mangoAcc,
      perpMarket,
      quoteRootBank,
      mangoCache.priceCache[marketIndex].price,
    );
    return [tx];
  }
}
