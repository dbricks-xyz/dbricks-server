import { computed, reactive } from 'vue';
import axios, { AxiosPromise } from 'axios';
import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { IConfiguredBrick } from '@/common/interfaces/common.interfaces';
import { deserializeIxs, deserializeSigners } from '@/common/util/common.serializers';

const state = reactive({
  configuredBricks: <IConfiguredBrick[]>[],
});

export const getConfiguredBricks = computed(() => state.configuredBricks);

export const addOrModifyConfiguredBrick = (newOrUpdatedBrick: IConfiguredBrick):void => {
  const i = state.configuredBricks.map((b) => b.id).indexOf(newOrUpdatedBrick.id);
  if (i === -1) {
    state.configuredBricks.push(newOrUpdatedBrick);
  } else {
    state.configuredBricks[i] = newOrUpdatedBrick;
  }
  console.log('State updated', state.configuredBricks);
};

export const removeConfiguredBrick = (brickId: number):void => {
  const i = state.configuredBricks.map((b) => b.id).indexOf(brickId);
  if (i >= 0) {
    state.configuredBricks.splice(i, 1);
  }
  console.log('State updated', state.configuredBricks);
};

const ownerKp = Keypair.fromSecretKey(Uint8Array.from([33, 69, 128, 11, 81, 65, 22, 189, 41, 46, 190, 10, 16, 122, 186, 58, 140, 244, 81, 233, 185, 3, 226, 84, 219, 211, 156, 70, 178, 18, 129, 239, 90, 60, 27, 29, 73, 7, 148, 64, 156, 190, 9, 177, 167, 184, 207, 165, 154, 93, 255, 186, 98, 245, 24, 124, 56, 232, 102, 149, 146, 84, 75, 217]));

export async function prepareTxs(): Promise<[TransactionInstruction[], Signer[]]> {
  const ixs: TransactionInstruction[] = [];
  const signers: Signer[] = [];

  const requests: AxiosPromise[] = [];
  state.configuredBricks.forEach((b) => {
    console.log({
      ...b.payload,
      ownerPk: ownerKp.publicKey.toBase58(),
    });
    const r = axios({
      baseURL: 'http://localhost:3000',
      method: b.method,
      url: b.path,
      data: {
        ...b.payload,
        ownerPk: ownerKp.publicKey.toBase58(),
      },
    });
    requests.push(r);
  });

  const responses = await axios.all(requests);

  responses.forEach((r) => {
    const [serIxs, serSigners] = r.data;
    ixs.push(...deserializeIxs(serIxs));
    signers.push(...deserializeSigners(serSigners));
  });

  console.log('Resultingg instructions', ixs);
  console.log('Resultingg signers', signers);

  return [ixs, signers];
}

async function _prepareAndSendTx(ixs: TransactionInstruction[], signers: Signer[]) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const tx = new Transaction().add(...ixs);
  const sig = await sendAndConfirmTransaction(connection, tx, signers);
  console.log('Tx successful,', sig);
}

export async function executeTx(ixs: TransactionInstruction[], signers: Signer[]) {
  await _prepareAndSendTx(
    ixs,
    [
      ownerKp,
      ...signers,
    ],
  );
}
