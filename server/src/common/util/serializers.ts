import {
  Keypair,
  PublicKey,
  Signer,
  TransactionInstruction,
} from '@solana/web3.js';

type serializedAcc = {
  pubkey: string,
  isSigner: boolean,
  isWritable: boolean,
}

type serializedIx = {
  keys: serializedAcc[],
  programId: string,
  data: string,
}

type serializedSigner = {
  secretKey: Uint8Array,
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
  const deserializedIx: TransactionInstruction[] = [];
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
    deserializedIx.push(newIx);
  });
  return deserializedIx;
}

export function serializeSigners(signers: Signer[]): serializedSigner[] {
  const serializedSigners: serializedSigner[] = [];
  signers.forEach((s) => {
    serializedSigners.push({
      secretKey: s.secretKey,
    });
  });
  return serializedSigners;
}

export function deserializeSigners(signers: serializedSigner[]): Signer[] {
  const deserializedSigners: Signer[] = [];
  signers.forEach((s) => {
    deserializedSigners.push(Keypair.fromSeed(s.secretKey));
  });
  return deserializedSigners;
}
