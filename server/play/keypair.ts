import fs from 'fs';
import { Keypair } from '@solana/web3.js';

const KEYPAIR_PATH = '/home/dboures/.config/solana/id.json'; // todo change
const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
export const ownerKp = Keypair.fromSecretKey(Uint8Array.from(secretKey));
