import SolClient from "../../common/client/common.client";
import debug from "debug";
import {
  depositReserveLiquidityAndObligationCollateralInstruction, OBLIGATION_SIZE,
  refreshReserveInstruction
} from "@dbricks/dbricks-solend";
import {PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {SOLEND_MARKET_ID, SOLEND_MARKET_OWNER_ID, SOLEND_PROG_ID} from "../../config/config";
import fs from 'fs'
import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {mergeInstructionsAndSigners} from "../../common/util/common.util";

const log: debug.IDebugger = debug('app:solend-client');

export default class SolendClient extends SolClient {
  constructor() {
    super();
    log('Initialized Solend client')
  }

  async prepareDepositTransaction(
    mintPubkey: PublicKey,
    quantity: bigint,
    ownerPubkey: PublicKey,
  ): Promise<instructionsAndSigners> {
    const sourceLiquidity = (await this.getTokenAccountsForOwner(ownerPubkey, mintPubkey))[0].pubkey;
    const reserveInfo = findSolendReserveInfo(mintPubkey);
    const [userLPAccountInstructionsAndSigners, userLPPubkey] = await this.getOrCreateTokenAccountByMint(
      ownerPubkey,
      reserveInfo.reserveCollateralMint,
    );
    const [userObligationInstructionsAndSigners, userObligationPubkey] = await this.getOrCreateObligationAccount(
      ownerPubkey
    );
    const refreshReserveIx = refreshReserveInstruction(
      reserveInfo.reserve,
      reserveInfo.pythPriceOracle,
      reserveInfo.switchboardOracle,
      SOLEND_PROG_ID,
    )
    const depositIx = depositReserveLiquidityAndObligationCollateralInstruction(
      quantity,
      sourceLiquidity,
      userLPPubkey,
      reserveInfo.reserve,
      reserveInfo.reserveLiquidity,
      reserveInfo.reserveCollateralMint,
      SOLEND_MARKET_ID,
      SOLEND_MARKET_OWNER_ID,
      reserveInfo.reserveCollateral,
      userObligationPubkey,
      ownerPubkey,
      reserveInfo.pythPriceOracle,
      reserveInfo.switchboardOracle,
      ownerPubkey,
      SOLEND_PROG_ID,
    )
    const finalInstructionsAndSigners = mergeInstructionsAndSigners(userLPAccountInstructionsAndSigners, userObligationInstructionsAndSigners);
    finalInstructionsAndSigners.instructions.push(refreshReserveIx);
    finalInstructionsAndSigners.instructions.push(depositIx)
    return finalInstructionsAndSigners
  }

  async prepareWithdrawTransaction() {
    console.log('withdraw')
  }

  async prepareBorrowTransaction() {

  }

  async prepareRepayTransaction() {

  }

  async getOrCreateObligationAccount(ownerPubkey: PublicKey): Promise<[instructionsAndSigners, PublicKey]> {
    const instructionsAndSigners: instructionsAndSigners = {instructions:[], signers:[]}
    const seed = SOLEND_MARKET_ID.toBase58().slice(0, 32);
    const obligationAddress = await PublicKey.createWithSeed(
      ownerPubkey,
      seed,
      new PublicKey(SOLEND_PROG_ID),
    );
    const obligationAccount = await this.connection.getAccountInfo(obligationAddress);
    if (obligationAccount) {
      console.log(`Obligation account for user ${ownerPubkey} already exists. Proceeding.`)
    } else {
      console.log(`Obligation account for user ${ownerPubkey} needs to be created. Creating.`)
      const createIx = await this.createSolendStateAccount(obligationAddress, OBLIGATION_SIZE, ownerPubkey);
      instructionsAndSigners.instructions.push(createIx);
    }
    return [instructionsAndSigners, obligationAddress]
  }

  async createSolendStateAccount(
    newAccountPubkey: PublicKey,
    space: number,
    ownerPubkey: PublicKey,
  ): Promise<TransactionInstruction> {
    return SystemProgram.createAccount({
      programId: SOLEND_PROG_ID,
      fromPubkey: ownerPubkey,
      newAccountPubkey,
      space,
      lamports: await this.connection.getMinimumBalanceForRentExemption(space),
    });
  }

}

interface ISolendReserve {
  name: string,
  pythProductOracle: PublicKey,
  pythPriceOracle: PublicKey,
  switchboardOracle: PublicKey,
  reserve: PublicKey,
  reserveLiquidity: PublicKey,
  reserveCollateral: PublicKey,
  reserveCollateralMint: PublicKey,
  decimals: number,
}



function findSolendReserveInfo(mintPubkey: PublicKey): ISolendReserve {
  const reserves = JSON.parse(fs.readFileSync(`${__dirname}/../data/solendReservesMainnet.json`, 'utf8'));
  const foundReserveRaw = reserves[mintPubkey.toBase58()];
  return {
    name: foundReserveRaw.name,
    pythProductOracle: new PublicKey(foundReserveRaw.pythProductOracle),
    pythPriceOracle: new PublicKey(foundReserveRaw.pythPriceOracle),
    switchboardOracle: new PublicKey(foundReserveRaw.switchboardOracle),
    reserve: new PublicKey(foundReserveRaw.reserve),
    reserveLiquidity: new PublicKey(foundReserveRaw.reserveLiquidity),
    reserveCollateral: new PublicKey(foundReserveRaw.reserveCollateral),
    reserveCollateralMint: new PublicKey(foundReserveRaw.reserveCollateralMint),
    decimals: foundReserveRaw.decimals,
  }
}