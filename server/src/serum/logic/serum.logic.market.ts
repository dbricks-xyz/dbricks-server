import debug from 'debug';
import { DexInstructions } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ixAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import { SERUM_PROG_ID } from '../../config/config';

const log: debug.IDebugger = debug('app:serum-logic');

export async function prepInitMarketTx(
  marketPk: PublicKey,
  reqQPk: PublicKey,
  eventQPk: PublicKey,
  bidsPk: PublicKey,
  asksPk: PublicKey,
  // todo currently passing these in, in the future might derive
  baseVaultPk: PublicKey,
  quoteVaultPk: PublicKey,
  baseMintPk: PublicKey,
  quoteMintPk: PublicKey,
  baseLotSize: BN,
  quoteLotSize: BN,
  feeRateBps: BN,
  vaultSignerNonce: BN,
  quoteDustThreshold: BN,

): Promise<ixAndSigners> {
  const initMarketIx = DexInstructions.initializeMarket({
    // dex accounts
    market: marketPk,
    requestQueue: reqQPk,
    eventQueue: eventQPk,
    bids: bidsPk,
    asks: asksPk,
    // vaults
    baseVault: baseVaultPk,
    quoteVault: quoteVaultPk,
    // mints
    baseMint: baseMintPk,
    quoteMint: quoteMintPk,
    // rest
    baseLotSize,
    quoteLotSize,
    feeRateBps,
    vaultSignerNonce,
    quoteDustThreshold,
    programId: SERUM_PROG_ID,
    // todo add
    // authority = undefined,
    // pruneAuthority = undefined,
  });
  return [
    [initMarketIx],
    [],
  ];
}
