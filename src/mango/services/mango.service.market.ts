import {instructionsAndSigners} from '@dbricks/dbricks-ts';
import {QUOTE_INDEX} from '@blockworks-foundation/mango-client';
import {
  IMangoDEXMarket,
  IMangoDEXMarketSettleParamsParsed
} from '../interfaces/dex/mango.interfaces.dex.market';
import MangoClient from '../client/mango.client';

export default class MangoMarketService extends MangoClient implements IMangoDEXMarket {
  async settleSpot(params: IMangoDEXMarketSettleParamsParsed): Promise<instructionsAndSigners[]> {
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const markets = await this.loadSpotMarkets();

    const transaction = await this.prepareSettleSpotTransaction(
      mangoAccount,
      markets,
      params.ownerPubkey,
    );
    return [transaction];
  }

  async settlePerp(params: IMangoDEXMarketSettleParamsParsed): Promise<instructionsAndSigners[]> {
    await this.loadGroup();
    const mangoAccount = await this.loadMangoAccountForOwner(params.ownerPubkey, params.mangoAccountNumber);
    const perpMarket = await this.loadPerpMarket(params.marketPubkey);
    const marketIndex = this.group.getPerpMarketIndex(perpMarket.publicKey);
    const mangoCache = await this.group.loadCache(this.connection);
    const quoteRootBank = this.group.rootBankAccounts[QUOTE_INDEX];
    if (!quoteRootBank) {
      throw new Error('Error finding rootBankAccount for mangoGroup');
    }

    const transaction = await this.prepareSettlePerpTransaction(
      mangoCache,
      mangoAccount,
      perpMarket,
      quoteRootBank,
      mangoCache.priceCache[marketIndex].price,
    );
    return [transaction];
  }
}
