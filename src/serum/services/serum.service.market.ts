import {PublicKey} from '@solana/web3.js';
import BN from 'bn.js';
import {getVaultOwnerAndNonce} from '@project-serum/swap/lib/utils';
import {
  ISerumDEXMarket,
  ISerumDEXMarketInitParamsParsed,
  ISerumDEXMarketSettleParamsParsed
} from '../interfaces/dex/serum.interfaces.dex.market';
import {ixsAndSigners} from 'dbricks-lib';
import SerumClient from '../client/serum.client';
import {SERUM_PROG_ID} from '../../config/config';
import {mergeIxsAndSigners} from "../../common/util/common.util";

export default class SerumMarketService extends SerumClient implements ISerumDEXMarket {
  async init(params: ISerumDEXMarketInitParamsParsed): Promise<ixsAndSigners[]> {
    // taken from here - https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L499
    const feeRateBps = new BN(0);
    const quoteDustThreshold = new BN(100);

    const prepIxsAndSigners = await this.prepStateAccsForNewMarket(params.ownerPk);
    const [vaultOwnerPk, vaultNonce] = await getVaultOwnerAndNonce(
      prepIxsAndSigners.signers[0].publicKey,
      SERUM_PROG_ID,
    );
    const vaultIxsAndSigners = await this.prepVaultAccs(
      vaultOwnerPk as PublicKey,
      params.baseMintPk,
      params.quoteMintPk,
      params.ownerPk,
    );
    const [baseLotSize, quoteLotSize] = await this.calcBaseAndQuoteLotSizes(
      params.lotSize,
      params.tickSize,
      params.baseMintPk,
      params.quoteMintPk,
    );
    const initIxsAndSigners = await this.prepInitMarketTx(
      prepIxsAndSigners.signers[0].publicKey,
      prepIxsAndSigners.signers[1].publicKey,
      prepIxsAndSigners.signers[2].publicKey,
      prepIxsAndSigners.signers[3].publicKey,
      prepIxsAndSigners.signers[4].publicKey,
      vaultIxsAndSigners.signers[0].publicKey,
      vaultIxsAndSigners.signers[1].publicKey,
      params.baseMintPk,
      params.quoteMintPk,
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultNonce as BN,
      quoteDustThreshold,
    );
    const tx1 = prepIxsAndSigners;
    const tx2 = mergeIxsAndSigners(vaultIxsAndSigners, initIxsAndSigners);
    console.log('New market address will be:', tx1.signers[0].publicKey.toBase58());
    return [tx1, tx2];
  }

  async settle(params: ISerumDEXMarketSettleParamsParsed): Promise<ixsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPk);
    const [
      [ownerBaseIxsAndSigners, ownerBasePk],
      [ownerQuoteIxsAndSigners, ownerQuotePk],
    ] = await this.getBaseAndQuoteAccsFromMarket(
      market,
      params.ownerPk,
    );
    const settleIxsAndSigners = await this.prepSettleFundsTx(
      market,
      params.ownerPk,
      ownerBasePk,
      ownerQuotePk,
    );
    let tx = mergeIxsAndSigners(ownerBaseIxsAndSigners, ownerQuoteIxsAndSigners);
    tx = mergeIxsAndSigners(tx, settleIxsAndSigners);
    return [tx];
  }

  async getBaseQuote(marketPk: string): Promise<[string, string]> {
    return this.getBaseQuoteFromMarket(marketPk);
  }

}
