import { PublicKey } from "@solana/web3.js";
import debug from "debug";
import {
  ILenderDeposit,
  ixAndSigners,
} from "../../common/interfaces/lender/common.interfaces.lender.deposit";
import MangoClient from "../client/mango.client";

const log: debug.IDebugger = debug("app:mango-deposit-service");

class MangoDepositService implements ILenderDeposit {
  async deposit(
    token: string,
    quantity: number,
    ownerPk: PublicKey,
    destinationPk?: PublicKey
  ): Promise<ixAndSigners> {
    const mangoInformation = await MangoClient.loadAllAccounts(ownerPk, token);
    if (!mangoInformation) {
      return [[], []];
    }
    const { userAccounts, tokenAccPk, rootBank, nodeBank, vault } =
      mangoInformation;

    if (userAccounts.length === 0) {
      return await MangoClient.prepInitMangoAccountAndDepositTx(
        ownerPk,
        rootBank,
        nodeBank,
        vault,
        tokenAccPk,
        quantity
      );
    }

    let mangoAccount;
    if (destinationPk) {
      mangoAccount = userAccounts.find(
        (acc) => acc.publicKey.toBase58() === destinationPk.toBase58()
      );
      if (!mangoAccount) {
        log(
          `${destinationPk.toBase58()} is not owned by ${ownerPk.toBase58()}`
        );
        return [[], []];
      }
    } else {
      return [[], []];
    }

    return MangoClient.prepDepositTx(
      mangoAccount,
      ownerPk,
      rootBank,
      nodeBank,
      vault,
      tokenAccPk,
      quantity
    );
  }
}

export default new MangoDepositService();
