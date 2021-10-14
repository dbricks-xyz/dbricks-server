import SolClient from "../../common/client/common.client";
import debug from "debug";
import {
  borrowObligationLiquidityInstruction,
  depositReserveLiquidityAndObligationCollateralInstruction,
  initObligationInstruction,
  OBLIGATION_SIZE,
  parseObligation,
  refreshObligationInstruction,
  refreshReserveInstruction,
  repayObligationLiquidityInstruction,
  withdrawObligationCollateralAndRedeemReserveCollateralInstruction
} from "@dbricks/dbricks-solend";
import {PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {SOLEND_MARKET_ID, SOLEND_MARKET_OWNER_ID, SOLEND_PROG_ID} from "../../config/config";
import fs from 'fs'
import {instructionsAndSigners} from "@dbricks/dbricks-ts";
import {mergeInstructionsAndSigners} from "../../common/util/common.util";

const log: debug.IDebugger = debug('app:solend-client');

export default class SolendClient extends SolClient {
  obligationDeposits: PublicKey[] = [];
  obligationBorrows: PublicKey[] = [];

  constructor() {
    super();
    log('Initialized Solend client')
  }

  //todo note SOL currently doesn't work - need to mess around with wrapped SOL tokens
  async prepareDepositTransaction(
    mintPubkey: PublicKey,
    quantity: bigint,
    ownerPubkey: PublicKey,
  ): Promise<instructionsAndSigners> {
    const sourceLiquidity = (await this.getTokenAccountsForOwner(ownerPubkey, mintPubkey))[0].pubkey;
    const reserveInfo = findSolendReserveInfoByMint(mintPubkey);
    const [userLPAccountInstructionsAndSigners, userLPPubkey] = await this.getOrCreateAssociatedTokenAccountByMint(
      reserveInfo.reserveCollateralMint,
      ownerPubkey,
      ownerPubkey,
    );
    const [userObligationInstructionsAndSigners, userObligationPubkey] = await this.getOrCreateObligationAccount(
      ownerPubkey
    );
    const refreshReserveInstruction = this.getRefreshReserveInstruction(mintPubkey);
    const depositInstruction = depositReserveLiquidityAndObligationCollateralInstruction(
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
    finalInstructionsAndSigners.instructions.push(refreshReserveInstruction);
    finalInstructionsAndSigners.instructions.push(depositInstruction)
    return finalInstructionsAndSigners
  }

  async prepareWithdrawTransaction(
    mintPubkey: PublicKey,
    quantity: bigint,
    ownerPubkey: PublicKey,
  ): Promise<instructionsAndSigners[]> {
    const {
      instructionsAndSigners,
      reserveInfo,
      userObligationPubkey,
      userLPPubkey,
      userLiqPubkey,
    } = await this.prepareTokenAndRefreshInstructions(mintPubkey, ownerPubkey);

    const withdrawInstruction = withdrawObligationCollateralAndRedeemReserveCollateralInstruction(
      quantity,
      reserveInfo.reserveCollateral,
      userLPPubkey,
      reserveInfo.reserve,
      userObligationPubkey,
      SOLEND_MARKET_ID,
      SOLEND_MARKET_OWNER_ID,
      userLiqPubkey,
      reserveInfo.reserveCollateralMint,
      reserveInfo.reserveLiquidity,
      ownerPubkey,
      ownerPubkey,
      SOLEND_PROG_ID
    );
    instructionsAndSigners.solendInstructionsAndSigners.instructions.push(withdrawInstruction);

    return [
      instructionsAndSigners.tokenInstructionsAndSigners,
      instructionsAndSigners.solendInstructionsAndSigners
    ];
  }

  async prepareBorrowTransaction(
    mintPubkey: PublicKey,
    quantity: bigint,
    ownerPubkey: PublicKey,
  ): Promise<instructionsAndSigners[]> {
    const {
      instructionsAndSigners,
      reserveInfo,
      userObligationPubkey,
      userLPPubkey,
      userLiqPubkey,
    } = await this.prepareTokenAndRefreshInstructions(mintPubkey, ownerPubkey);

    const borrowInstruction = borrowObligationLiquidityInstruction(
      quantity,
      reserveInfo.reserveLiquidity,
      userLiqPubkey,
      reserveInfo.reserve,
      reserveInfo.feeReceiver,
      userObligationPubkey,
      SOLEND_MARKET_ID,
      SOLEND_MARKET_OWNER_ID,
      ownerPubkey,
      SOLEND_PROG_ID,
    );
    instructionsAndSigners.solendInstructionsAndSigners.instructions.push(borrowInstruction);

    return [
      instructionsAndSigners.tokenInstructionsAndSigners,
      instructionsAndSigners.solendInstructionsAndSigners
    ];
  }

  async prepareRepayTransaction(
    mintPubkey: PublicKey,
    quantity: bigint,
    ownerPubkey: PublicKey,
  ): Promise<instructionsAndSigners[]> {
    const {
      instructionsAndSigners,
      reserveInfo,
      userObligationPubkey,
      userLPPubkey,
      userLiqPubkey,
    } = await this.prepareTokenAndRefreshInstructions(mintPubkey, ownerPubkey);

    const repayInstruction = repayObligationLiquidityInstruction(
      quantity,
      userLiqPubkey,
      reserveInfo.reserveLiquidity,
      reserveInfo.reserve,
      userObligationPubkey,
      SOLEND_MARKET_ID,
      ownerPubkey,
      SOLEND_PROG_ID,
    );
    instructionsAndSigners.solendInstructionsAndSigners.instructions.push(repayInstruction);

    return [
      instructionsAndSigners.tokenInstructionsAndSigners,
      instructionsAndSigners.solendInstructionsAndSigners
    ];
  }

  // --------------------------------------- helpers

  /**
   * Prepares all the instructions needed for refreshing obligations / reserves,
   * as well any missing token accounts.
   * Basically boilerplate for each function above.
   */
  async prepareTokenAndRefreshInstructions(
    mintPubkey: PublicKey,
    ownerPubkey: PublicKey,
  ) {
    //find all reserves that the user has either deposited into or borrowed from
    const [_, userObligationPubkey] = await this.getOrCreateObligationAccount(
      ownerPubkey
    );
    await this.refreshObligDepositsAndBorrows(userObligationPubkey);

    //prepare instructions to create any necessary token accounts
    const reserveInfo = findSolendReserveInfoByMint(mintPubkey);
    const [userLPAccountInstructionsAndSigners, userLPPubkey] = await this.getOrCreateAssociatedTokenAccountByMint(
      reserveInfo.reserveCollateralMint,
      ownerPubkey,
      ownerPubkey,
    );
    const [userLiqAccountInstructionsAndSigners, userLiqPubkey] = await this.getOrCreateAssociatedTokenAccountByMint(
      mintPubkey,
      ownerPubkey,
      ownerPubkey,
    );
    const tokenInstructionsAndSigners = mergeInstructionsAndSigners(userLPAccountInstructionsAndSigners, userLiqAccountInstructionsAndSigners);

    //prepare refresh instructions (oblig and reserves)
    const solendInstructionsAndSigners = this.prepareAllRefreshInstructionss(userObligationPubkey, mintPubkey);

    return {
      instructionsAndSigners: {
        tokenInstructionsAndSigners,
        solendInstructionsAndSigners
      },
      reserveInfo,
      userObligationPubkey,
      userLPPubkey,
      userLiqPubkey,
    };
  }

  prepareAllRefreshInstructionss(
    userObligationPubkey: PublicKey,
    mintPubkey: PublicKey,
  ): instructionsAndSigners {
    const instructionsAndSigners: instructionsAndSigners = {instructions: [], signers: []};
    const refreshObligInstruction = this.getRefreshObligInstruction(userObligationPubkey);
    this.obligationDeposits.forEach(reservePubkey => {
      const mintPubkey = findSolendReserveInfoByReservePubkey(reservePubkey).mint;
      const refreshReserveInstruction = this.getRefreshReserveInstruction(mintPubkey);
      if (instructionsAndSigners.instructions.indexOf(refreshReserveInstruction) === -1) {
        instructionsAndSigners.instructions.push(refreshReserveInstruction)
      }
    });
    this.obligationBorrows.forEach(reservePubkey => {
      const mintPubkey = findSolendReserveInfoByReservePubkey(reservePubkey).mint;
      const refreshReserveInstruction = this.getRefreshReserveInstruction(mintPubkey);
      if (instructionsAndSigners.instructions.indexOf(refreshReserveInstruction) === -1) {
        instructionsAndSigners.instructions.push(refreshReserveInstruction)
      }
    });

    // add target asset in case user never interacted with it before,
    // and it doesn't get picked up by current deposits / borrows
    const targetRefreshInstruction = this.getRefreshReserveInstruction(mintPubkey);
    if (instructionsAndSigners.instructions.indexOf(targetRefreshInstruction) === -1) {
      instructionsAndSigners.instructions.push(targetRefreshInstruction);
    }

    instructionsAndSigners.instructions.push(refreshObligInstruction);
    return instructionsAndSigners
  }

  async refreshObligDepositsAndBorrows(obligationPubkey: PublicKey) {
    const obligInfo = await this.connection.getAccountInfo(obligationPubkey);
    const obligState = parseObligation(obligationPubkey, obligInfo!);
    this.obligationDeposits = obligState!.data.deposits.map(d => d.depositReserve);
    this.obligationBorrows = obligState!.data.borrows.map(d => d.borrowReserve);
  }

  getRefreshReserveInstruction(
    mintPubkey: PublicKey,
  ): TransactionInstruction {
    const reserveInfo = findSolendReserveInfoByMint(mintPubkey);
    return refreshReserveInstruction(
      reserveInfo.reserve,
      reserveInfo.pythPriceOracle,
      reserveInfo.switchboardOracle,
      SOLEND_PROG_ID,
    )
  }

  getRefreshObligInstruction(
    obligationPubkey: PublicKey,
  ): TransactionInstruction {
    return refreshObligationInstruction(
      obligationPubkey,
      this.obligationDeposits,
      this.obligationBorrows,
      SOLEND_PROG_ID,
    );
  }

  async getOrCreateObligationAccount(ownerPubkey: PublicKey): Promise<[instructionsAndSigners, PublicKey]> {
    const instructionsAndSigners: instructionsAndSigners = {instructions: [], signers: []}
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
      const createInstruction = await this.createSolendStateAccount(obligationAddress, OBLIGATION_SIZE, ownerPubkey, seed);
      //todo apparently the below init instructions is not necessary (@nope in discord)
      const initObligInstruction = initObligationInstruction(
        obligationAddress,
        SOLEND_MARKET_ID,
        ownerPubkey,
        SOLEND_PROG_ID,
      );
      instructionsAndSigners.instructions.push(createInstruction);
      instructionsAndSigners.instructions.push(initObligInstruction);
    }
    return [instructionsAndSigners, obligationAddress]
  }

  async createSolendStateAccount(
    newAccountPubkey: PublicKey,
    space: number,
    ownerPubkey: PublicKey,
    seed: string
  ): Promise<TransactionInstruction> {
    return SystemProgram.createAccountWithSeed({
      fromPubkey: ownerPubkey,
      basePubkey: ownerPubkey,
      seed,
      newAccountPubkey,
      lamports: await this.connection.getMinimumBalanceForRentExemption(space),
      space,
      programId: SOLEND_PROG_ID,
    });
  }

}

// --------------------------------------- json related

interface ISolendReserve {
  name: string,
  mint: PublicKey,
  pythProductOracle: PublicKey,
  pythPriceOracle: PublicKey,
  switchboardOracle: PublicKey,
  reserve: PublicKey,
  reserveLiquidity: PublicKey,
  reserveCollateral: PublicKey,
  reserveCollateralMint: PublicKey,
  feeReceiver: PublicKey,
  decimals: number,
}

export function serializeFoundReserve(reserveRaw: any): ISolendReserve {
  return {
    name: reserveRaw.name,
    mint: new PublicKey(reserveRaw.mint),
    pythProductOracle: new PublicKey(reserveRaw.pythProductOracle),
    pythPriceOracle: new PublicKey(reserveRaw.pythPriceOracle),
    switchboardOracle: new PublicKey(reserveRaw.switchboardOracle),
    reserve: new PublicKey(reserveRaw.reserve),
    reserveLiquidity: new PublicKey(reserveRaw.reserveLiquidity),
    reserveCollateral: new PublicKey(reserveRaw.reserveCollateral),
    reserveCollateralMint: new PublicKey(reserveRaw.reserveCollateralMint),
    feeReceiver: new PublicKey(reserveRaw.feeReceiver),
    decimals: reserveRaw.decimals,
  }
}

export function findSolendReserveInfoByMint(mintPubkey: PublicKey): ISolendReserve {
  const reserves = JSON.parse(fs.readFileSync(`${__dirname}/../data/solendReservesMainnet.json`, 'utf8'));
  const foundReserveRaw = reserves.find((r: any) => r.mint === mintPubkey.toBase58());
  return serializeFoundReserve(foundReserveRaw);
}

export function findSolendReserveInfoByReservePubkey(reserve: PublicKey): ISolendReserve {
  const reserves = JSON.parse(fs.readFileSync(`${__dirname}/../data/solendReservesMainnet.json`, 'utf8'));
  const foundReserveRaw = reserves.find((r: any) => r.reserve === reserve.toBase58());
  return serializeFoundReserve(foundReserveRaw);
}

