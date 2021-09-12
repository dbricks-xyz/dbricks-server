import {
  IDS, makeDepositInstruction, MangoAccount, MangoClient as NativeMangoClient, MangoGroup, TokenAccount, TokenAccountLayout, uiToNative,
} from '@blockworks-foundation/mango-client';
import { TokenInstructions } from '@project-serum/serum';
import { WRAPPED_SOL_MINT, initializeAccount, closeAccount } from '@project-serum/serum/lib/token-instructions';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
import debug from 'debug';
import { SolClient } from '../../common/client/common.client';
import { ixAndSigners } from '../../common/interfaces/dex/common.interfaces.dex.order';
import { MANGO_PROG_ID } from '../../config/config';
import { getMint } from '../../config/config.util';

const log: debug.IDebugger = debug('app:mango-client');

export interface MangoInformation {
  userAccounts: MangoAccount[],
  tokenAccount: TokenAccount,
  rootBank: PublicKey,
  nodeBank: PublicKey,
  vault: PublicKey
}

export class MangoClient extends SolClient {

  nativeClient: NativeMangoClient;
  group!: MangoGroup;

  constructor() {
    super();
    this.nativeClient = new NativeMangoClient(this.connection, MANGO_PROG_ID);
    log('Initialized Mango client');
  }

  async loadGroup() {
    const MANGO_GROUP_NAME = process.env.NETWORK === 'mainnet' ? 'mainnet.1' : 'devnet.1';
    const mangoGroupIds = IDS.groups.find(
      (group) => group.name === MANGO_GROUP_NAME,
    );
    if (!mangoGroupIds) {
      log('Failed to connect to Mango');
      return;
    }
    const mangoGroup = await this.nativeClient.getMangoGroup(new PublicKey(mangoGroupIds.publicKey));
    await mangoGroup.loadRootBanks(this.connection);
    await Promise.all(mangoGroup.rootBankAccounts.map((rootBank) => { return rootBank?.loadNodeBanks(this.connection) } )); // load each nodeBank for all rootBanks
    this.group = mangoGroup;
  }

  async loadUserAccounts(ownerPk: PublicKey) {
    if (!this.group) {
      await this.loadGroup();
    }
    try {
      return await this.nativeClient
        .getMangoAccountsForOwner(this.group, ownerPk, true);
    } catch (err) {
      log('Could not load Mango margin accounts', err);
    }
  }

  async loadAllAccounts(ownerPk: PublicKey, token:string) : Promise<MangoInformation | undefined> {
    if (!this.group) {
      await this.loadGroup();
    }
    const tokenResp = await this.connection.getTokenAccountsByOwner(ownerPk, {
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    });
    const tokenAccounts = tokenResp.value.map(
      ({ pubkey, account }) => new TokenAccount(pubkey, TokenAccountLayout.decode(account.data)),
    );
    const mintAddress = getMint(token);
    const tokenAccount = tokenAccounts.find((acc) => acc.mint.toBase58() === mintAddress.toBase58());
    if (!tokenAccount) {
      log(`Error loading ${token} token account`);
      return;
    }

    const accounts = await this.loadUserAccounts(ownerPk);
    const tokenIndex = this.group.getTokenIndex(tokenAccount.mint);
    const { rootBank } = this.group.tokens[tokenIndex];
    const nodeBank = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = this.group.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;

    if (!rootBank || !nodeBank || !vault) {
      log('Error loading Mango vault accounts');
      return;
    }

    return {
      userAccounts: accounts ?? [],
      tokenAccount: tokenAccount,
      rootBank: rootBank,
      nodeBank: nodeBank,
      vault: vault
    }
  }

  async getDepositTxn(
    mangoAccount: MangoAccount,
    ownerPk: PublicKey,
    rootBank: PublicKey,
    nodeBank: PublicKey,
    vault: PublicKey,
    tokenAcc: TokenAccount,
    quantity: number,
  ): Promise<ixAndSigners> {
    // TODO: if no already exisiting Mango account, will need init and deposit instructions
    const transactionIx = [];
    const additionalSigners: Array<Keypair> = [];
    const tokenIndex = this.group.getTokenIndex(tokenAcc.mint);
    const tokenMint = this.group.tokens[tokenIndex].mint;
  
    let wrappedSolAccount: Keypair | null = null;
    if (
      tokenMint.equals(WRAPPED_SOL_MINT)
          && tokenAcc.publicKey.toBase58() === ownerPk.toBase58()
    ) {
      wrappedSolAccount = new Keypair();
      const lamports = Math.round(quantity * LAMPORTS_PER_SOL) + 1e7;
      transactionIx.push(
        SystemProgram.createAccount({
          fromPubkey: ownerPk,
          newAccountPubkey: wrappedSolAccount.publicKey,
          lamports,
          space: 165,
          programId: TOKEN_PROGRAM_ID,
        }),
      );
  
      transactionIx.push(
        initializeAccount({
          account: wrappedSolAccount.publicKey,
          mint: WRAPPED_SOL_MINT,
          owner: ownerPk,
        }),
      );
  
      additionalSigners.push(wrappedSolAccount);
    }
  
    const nativeQuantity = uiToNative(
      quantity,
      this.group.tokens[tokenIndex].decimals,
    );
  
    const instruction = makeDepositInstruction(
      MANGO_PROG_ID,
      this.group.publicKey,
      ownerPk,
      this.group.mangoCache,
      mangoAccount.publicKey,
      rootBank,
      nodeBank,
      vault,
      wrappedSolAccount?.publicKey ?? tokenAcc.publicKey,
      nativeQuantity,
    );
  
    transactionIx.push(instruction);
  
    if (wrappedSolAccount) {
      transactionIx.push(
        closeAccount({
          source: wrappedSolAccount.publicKey,
          destination: ownerPk,
          owner: ownerPk,
        }),
      );
    }
  
    return [transactionIx, additionalSigners];
  }

}

export default new MangoClient();
