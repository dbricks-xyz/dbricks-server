import {PublicKey} from '@solana/web3.js';
import BN from 'bn.js';
import {getVaultOwnerAndNonce} from '@project-serum/swap/lib/utils';
import {
  ISerumDEXMarket,
  ISerumDEXMarketInitParamsParsed,
  ISerumDEXMarketSettleParamsParsed
} from '../interfaces/dex/serum.interfaces.dex.market';
import {instructionsAndSigners} from '@dbricks/dbricks-ts';
import SerumClient from '../client/serum.client';
import {SERUM_PROG_ID} from '../../config/config';
import {mergeInstructionsAndSigners} from "../../common/util/common.util";
import debug from "debug";

const log: debug.IDebugger = debug('app:serum-market-service');

export default class SerumMarketService extends SerumClient implements ISerumDEXMarket {
  async init(params: ISerumDEXMarketInitParamsParsed): Promise<instructionsAndSigners[]> {
    // taken from here - https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L499
    const feeRateBps = new BN(0);
    const quoteDustThreshold = new BN(100);

    const prepareInstructionsAndSigners = await this.prepareStateAccountsForNewMarket(params.ownerPubkey);
    const [vaultOwnerPubkey, vaultNonce] = await getVaultOwnerAndNonce(
      prepareInstructionsAndSigners.signers[0].publicKey,
      SERUM_PROG_ID,
    );
    const vaultInstructionsAndSigners = await this.prepareVaultAccounts(
      vaultOwnerPubkey as PublicKey,
      params.baseMintPubkey,
      params.quoteMintPubkey,
      params.ownerPubkey,
    );
    const [baseLotSize, quoteLotSize] = await this.calcBaseAndQuoteLotSizes(
      params.lotSize,
      params.tickSize,
      params.baseMintPubkey,
      params.quoteMintPubkey,
    );
    const initInstructionsAndSigners = await this.prepareInitMarketTransaction(
      prepareInstructionsAndSigners.signers[0].publicKey,
      prepareInstructionsAndSigners.signers[1].publicKey,
      prepareInstructionsAndSigners.signers[2].publicKey,
      prepareInstructionsAndSigners.signers[3].publicKey,
      prepareInstructionsAndSigners.signers[4].publicKey,
      vaultInstructionsAndSigners.signers[0].publicKey,
      vaultInstructionsAndSigners.signers[1].publicKey,
      params.baseMintPubkey,
      params.quoteMintPubkey,
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultNonce as BN,
      quoteDustThreshold,
    );
    const transaction1 = prepareInstructionsAndSigners;
    const transaction2 = mergeInstructionsAndSigners(vaultInstructionsAndSigners, initInstructionsAndSigners);
    log('New market address will be:', transaction1.signers[0].publicKey.toBase58());
    return [transaction1, transaction2];
  }

  async settle(params: ISerumDEXMarketSettleParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const [
      [ownerBaseInstructionsAndSigners, ownerBasePubkey],
      [ownerQuoteInstructionsAndSigners, ownerQuotePubkey],
    ] = await this.getBaseAndQuoteAccountsFromMarket(
      market,
      params.ownerPubkey,
    );
    const settleInstructionsAndSigners = await this.prepareSettleFundsTransaction(
      market,
      params.ownerPubkey,
      ownerBasePubkey,
      ownerQuotePubkey,
    );
    let transaction = mergeInstructionsAndSigners(ownerBaseInstructionsAndSigners, ownerQuoteInstructionsAndSigners);
    transaction = mergeInstructionsAndSigners(transaction, settleInstructionsAndSigners);
    return [transaction];
  }

  async getMarketMints(marketPubkey: string): Promise<[string, string]> {
    return this.getMarketMintsFromMarketPubkey(marketPubkey);
  }

}
