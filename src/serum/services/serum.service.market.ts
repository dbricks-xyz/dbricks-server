import {PublicKey} from '@solana/web3.js';
import BN from 'bn.js';
import {getVaultOwnerAndNonce} from '@project-serum/swap/lib/utils';
import {
  ISerumDEXMarket,
  ISerumDEXMarketInitParamsParsed,
  ISerumDEXMarketSettleParamsParsed
} from '../interfaces/dex/serum.interfaces.dex.market';
import {instructionsAndSigners} from 'dbricks-lib';
import SerumClient from '../client/serum.client';
import {SERUM_PROG_ID} from '../../config/config';
import {mergeInstructionsAndSigners} from "../../common/util/common.util";

export default class SerumMarketService extends SerumClient implements ISerumDEXMarket {
  async init(params: ISerumDEXMarketInitParamsParsed): Promise<instructionsAndSigners[]> {
    // taken from here - https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L499
    const feeRateBps = new BN(0);
    const quoteDustThreshold = new BN(100);

    const prepInstructionsAndSigners = await this.prepStateAccountsForNewMarket(params.ownerPubkey);
    const [vaultOwnerPubkey, vaultNonce] = await getVaultOwnerAndNonce(
      prepInstructionsAndSigners.signers[0].publicKey,
      SERUM_PROG_ID,
    );
    const vaultInstructionsAndSigners = await this.prepVaultAccounts(
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
    const initInstructionsAndSigners = await this.prepInitMarketTransaction(
      prepInstructionsAndSigners.signers[0].publicKey,
      prepInstructionsAndSigners.signers[1].publicKey,
      prepInstructionsAndSigners.signers[2].publicKey,
      prepInstructionsAndSigners.signers[3].publicKey,
      prepInstructionsAndSigners.signers[4].publicKey,
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
    const transaction1 = prepInstructionsAndSigners;
    const transaction2 = mergeInstructionsAndSigners(vaultInstructionsAndSigners, initInstructionsAndSigners);
    console.log('New market address will be:', transaction1.signers[0].publicKey.toBase58());
    return [transaction1, transaction2];
  }

  async settle(params: ISerumDEXMarketSettleParamsParsed): Promise<instructionsAndSigners[]> {
    const market = await this.loadSerumMarket(params.marketPubkey);
    const [
      [ownerBaseInstructionsAndSigners, ownerBasePk],
      [ownerQuoteInstructionsAndSigners, ownerQuotePk],
    ] = await this.getBaseAndQuoteAccountsFromMarket(
      market,
      params.ownerPubkey,
    );
    const settleInstructionsAndSigners = await this.prepSettleFundsTransaction(
      market,
      params.ownerPubkey,
      ownerBasePk,
      ownerQuotePk,
    );
    let transaction = mergeInstructionsAndSigners(ownerBaseInstructionsAndSigners, ownerQuoteInstructionsAndSigners);
    transaction = mergeInstructionsAndSigners(transaction, settleInstructionsAndSigners);
    return [transaction];
  }

  async getMarketMints(marketPubkey: string): Promise<[string, string]> {
    return this.getMarketMintsFromMarketPubkey(marketPubkey);
  }

}
