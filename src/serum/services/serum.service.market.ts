import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getVaultOwnerAndNonce } from '@project-serum/swap/lib/utils';
import { IDEXMarket } from '../../common/interfaces/dex/common.interfaces.dex.market';
import { ixsAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import SerumClient from '../client/serum.client';
import { SERUM_PROG_ID } from '../../config/config';

export default class SerumMarketService extends SerumClient implements IDEXMarket {
  async init(
    baseMintPk: PublicKey,
    quoteMintPk: PublicKey,
    lotSize: number,
    tickSize: number,
    ownerPk: PublicKey,
  ): Promise<ixsAndSigners> {
    // taken from here - https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L499
    const feeRateBps = new BN(0);
    const quoteDustThreshold = new BN(100);

    const [prepIxs, prepKps] = await this.prepStateAccsForNewMarket(ownerPk);

    const [vaultOwnerPk, vaultNonce] = await getVaultOwnerAndNonce(
      prepKps[0].publicKey,
      SERUM_PROG_ID,
    );
    const [vaultIxs, vaultSigners] = await this.prepVaultAccs(
      vaultOwnerPk as PublicKey,
      baseMintPk,
      quoteMintPk,
      ownerPk,
    );

    const [baseLotSize, quoteLotSize] = await this.calcBaseAndQuoteLotSizes(
      lotSize,
      tickSize,
      baseMintPk,
      quoteMintPk,
    );

    const [ixInitMarket, signersInitMarket] = await this.prepInitMarketTx(
      prepKps[0].publicKey,
      prepKps[1].publicKey,
      prepKps[2].publicKey,
      prepKps[3].publicKey,
      prepKps[4].publicKey,
      vaultSigners[0].publicKey,
      vaultSigners[1].publicKey,
      baseMintPk,
      quoteMintPk,
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultNonce as BN,
      quoteDustThreshold,
    );

    // todo tx size limit
    return [
      [...prepIxs, ...vaultIxs, ...ixInitMarket],
      [...prepKps, ...vaultSigners, ...signersInitMarket],
    ];
  }

  async settle(marketPk: PublicKey, ownerPk: PublicKey): Promise<ixsAndSigners> {
    const market = await this.loadSerumMarket(marketPk);
    const [
      [ownerBaseIxsAndSigners, ownerBasePk],
      [ownerQuoteIxsAndSigners, ownerQuotePk],
    ] = await this.getBaseAndQuoteAccsFromMarket(
      market,
      ownerPk,
    );
    const [ixSettle, signersSettle] = await this.prepSettleFundsTx(
      market,
      ownerPk,
      ownerBasePk,
      ownerQuotePk,
    );
    return [
      [...ownerBaseIxsAndSigners[0], ...ownerQuoteIxsAndSigners[0], ...ixSettle],
      [...ownerBaseIxsAndSigners[1], ...ownerQuoteIxsAndSigners[1], ...signersSettle],
    ];
  }
}
