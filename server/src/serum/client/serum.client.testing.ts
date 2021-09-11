import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import { SolTestingClient } from '../../common/client/common.client.testing';
import { SERUM_PROG_ID } from '../../config/config';

export class SerumTestingClient extends SolTestingClient {
  async generateCreateStateAccIx(
    stateAccPk: PublicKey,
    space: number,
  ): Promise<TransactionInstruction> {
    return SystemProgram.createAccount({
      programId: SERUM_PROG_ID,
      fromPubkey: this.testingKp.publicKey,
      newAccountPubkey: stateAccPk,
      space,
      lamports: await this.connection.getMinimumBalanceForRentExemption(space),
    });
  }

  async consumeEvents(market: Market) {
    const openOrders = await market.findOpenOrdersAccountsForOwner(
      this.connection,
      this.testingKp.publicKey,
    );
    const consumeEventsIx = market.makeConsumeEventsInstruction(
      openOrders.map((oo) => oo.publicKey), 100,
    );
    await this.prepareAndSendTx(
      [consumeEventsIx],
      [this.testingKp],
    );
  }
}
