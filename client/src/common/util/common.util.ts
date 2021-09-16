import { Keypair } from '@solana/web3.js';
import fs from 'fs';

export function loadKpSync(path: string): Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assert(condition: boolean, message?: string) {
  if (!condition) {
    console.log(`${Error().stack}:main.ts`);
    throw message || 'Assertion failed';
  }
}
