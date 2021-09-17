import {
  Keypair,
  PublicKey,
  Signer,
  TransactionInstruction,
} from '@solana/web3.js';

export type serializedAcc = {
  pubkey: string,
  isSigner: boolean,
  isWritable: boolean,
}

export type serializedIx = {
  keys: serializedAcc[],
  programId: string,
  data: string,
}

export type serializedSigner = {
  secretKey: number[],
}

export function serializePk(pk: PublicKey): string {
  return pk.toBase58();
}

export function deserializePk(pk: string): PublicKey {
  return new PublicKey(pk);
}

export function serializeIxs(ixs: TransactionInstruction[]): serializedIx[] {
  const serializedIx: serializedIx[] = [];
  ixs.forEach((ix) => {
    const newIx: serializedIx = {
      keys: [],
      programId: serializePk(ix.programId),
      data: ix.data.toString('hex'),
    };
    ix.keys.forEach((k) => {
      newIx.keys.push(
        { pubkey: serializePk(k.pubkey), isSigner: k.isSigner, isWritable: k.isWritable },
      );
    });
    serializedIx.push(newIx);
  });
  return serializedIx;
}

export function deserializeIxs(ixs: serializedIx[]): TransactionInstruction[] {
  const deserializedIxs: TransactionInstruction[] = [];
  ixs.forEach((ix) => {
    const newIx: TransactionInstruction = {
      keys: [],
      programId: deserializePk(ix.programId),
      data: Buffer.from(ix.data, 'hex'),
    };
    ix.keys.forEach((k) => {
      newIx.keys.push(
        { pubkey: deserializePk(k.pubkey), isSigner: k.isSigner, isWritable: k.isWritable },
      );
    });
    deserializedIxs.push(newIx);
  });
  return deserializedIxs;
}

export function serializeSigners(signers: Signer[]): serializedSigner[] {
  const serializedSigners: serializedSigner[] = [];
  signers.forEach((s) => {
    serializedSigners.push({
      secretKey: Array.from(s.secretKey),
    });
  });
  return serializedSigners;
}

export function deserializeSigners(signers: serializedSigner[]): Signer[] {
  const deserializedSigners: Signer[] = [];
  signers.forEach((s) => {
    deserializedSigners.push(Keypair.fromSecretKey(new Uint8Array(s.secretKey)));
  });
  return deserializedSigners;
}
