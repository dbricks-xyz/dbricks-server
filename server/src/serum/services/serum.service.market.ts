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
    lotSize: string,
    tickSize: string,
    ownerPk: PublicKey,
  ): Promise<ixsAndSigners[]> {
    // taken from here - https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L499
    const feeRateBps = new BN(0);
    const quoteDustThreshold = new BN(100);

    const [prepIxs, prepKps] = await this.prepStateAccsForNewMarket(ownerPk);

    const [vaultSignerPk, vaultSignerNonce] = await getVaultOwnerAndNonce(
      prepKps[0].publicKey,
      SERUM_PROG_ID,
    );

    const [vaultIxs, vaultKps] = await this.prepVaultAccs(
      vaultSignerPk as PublicKey,
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
      vaultKps[0].publicKey,
      vaultKps[1].publicKey,
      baseMintPk,
      quoteMintPk,
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultSignerNonce as BN,
      quoteDustThreshold,
    );

    // todo tx size limit
    const tx1: ixsAndSigners = [prepIxs, prepKps];
    const tx2: ixsAndSigners = [
      [...vaultIxs, ...ixInitMarket],
      [...vaultKps, ...signersInitMarket],
    ];
    return [tx1, tx2];
  }

  async settle(market: string, ownerPk: PublicKey): Promise<ixsAndSigners> {
    const marketInstance = await this.loadSerumMarketFromName(market);
    const [
      [ownerBaseIxAndSigners, ownerBasePk],
      [ownerQuoteIxAndSigners, ownerQuotePk],
    ] = await this.getBaseAndQuoteAccsFromMarket(
      marketInstance,
      market,
      ownerPk,
    );
    const [ixSettle, signersSettle] = await this.prepSettleFundsTx(
      marketInstance,
      ownerPk,
      ownerBasePk,
      ownerQuotePk,
    );
    return [
      [...ownerBaseIxAndSigners[0], ...ownerQuoteIxAndSigners[0], ...ixSettle],
      [...ownerBaseIxAndSigners[1], ...ownerQuoteIxAndSigners[1], ...signersSettle],
    ];
  }
}
