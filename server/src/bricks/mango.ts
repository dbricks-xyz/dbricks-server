import {
    IDS,
    Config, getMarketByBaseSymbolAndKind,
    GroupConfig,
    MangoClient,
    MangoGroup,
    MangoAccount,
    makeDepositInstruction,
    uiToNative,
    WalletAdapter,
    TokenAccount
} from "@blockworks-foundation/mango-client";
import { closeAccount, initializeAccount, WRAPPED_SOL_MINT } from "@project-serum/serum/lib/token-instructions";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Account, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { CONNECTION_URL, MANGO_PROG_ID } from "../constants/constants";

let mangoClient: MangoClient;
let mangoGroup: MangoGroup;

export async function getMangoClient() {
    let connection = new Connection(CONNECTION_URL, 'processed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', CONNECTION_URL, version);

    
    const MANGO_GROUP_NAME = process.env.NETWORK === 'mainnet' ? 'mainnet.1': 'devnet.1'
    const mangoGroupIds = IDS['groups'].find(
    (group) => group.name === MANGO_GROUP_NAME
    )
    if (!mangoGroupIds) {
        console.log('Failed to connect to Mango');
        return
    }
    mangoClient = new MangoClient(connection, MANGO_PROG_ID);
    mangoGroup = await mangoClient.getMangoGroup(new PublicKey(mangoGroupIds.publicKey))
    console.log('connection to mango established');
}

export async function fetchMangoAccounts() {

    //TODO: get wallet
    // const mangoGroup = get().selectedMangoGroup.current
    // const wallet = get().wallet.current
    const walletPk = new PublicKey('PUBKEY HERE')

    if (!walletPk) return

    return mangoClient
      .getMangoAccountsForOwner(mangoGroup, walletPk, true)
      .then((mangoAccounts) => {
        if (mangoAccounts.length > 0) {
          const sortedAccounts = mangoAccounts
            .slice()
            .sort((a, b) =>
              a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1
            );
            return sortedAccounts;
            }
        }).catch((err) => {
        console.log('Could not load Mango margin accounts for wallet', err)
      })
  }


async function createMangoDepositTxn(
    mangoAccount: MangoAccount,
    owner: Account | WalletAdapter,
    tokenAcc: TokenAccount,
    quantity: number) { //TODO: if no already exisiting Mango account, will need init and deposit instructions, "create account doesn't really make sense as an option for our users"

    if(!mangoGroup) {
        return
    }
    const transaction = new Transaction();
    const additionalSigners: Array<Account> = [];
    const tokenIndex = mangoGroup.getTokenIndex(tokenAcc.mint)
    // const tokenIndex = mangoGroup.getRootBankIndex(rootBank);
    const tokenMint = mangoGroup.tokens[tokenIndex].mint;

    const rootbank = mangoGroup.tokens[tokenIndex].rootBank;
    const nodeBank = mangoGroup.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].publicKey;
    const vault = mangoGroup.rootBankAccounts[tokenIndex]?.nodeBankAccounts[0].vault;
    if (!nodeBank || !vault) {
        return
    }

    let wrappedSolAccount: Account | null = null;
    if (
      tokenMint.equals(WRAPPED_SOL_MINT) &&
      tokenAcc.publicKey.toBase58() === owner.publicKey.toBase58()
    ) {
      wrappedSolAccount = new Account();
      const lamports = Math.round(quantity * LAMPORTS_PER_SOL) + 1e7;
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: owner.publicKey,
          newAccountPubkey: wrappedSolAccount.publicKey,
          lamports,
          space: 165,
          programId: TOKEN_PROGRAM_ID,
        }),
      );

      transaction.add(
        initializeAccount({
          account: wrappedSolAccount.publicKey,
          mint: WRAPPED_SOL_MINT,
          owner: owner.publicKey,
        }),
      );

      additionalSigners.push(wrappedSolAccount);
    }

    const nativeQuantity = uiToNative(
      quantity,
      mangoGroup.tokens[tokenIndex].decimals,
    );

    const instruction = makeDepositInstruction(
        MANGO_PROG_ID,
      mangoGroup.publicKey,
      owner.publicKey,
      mangoGroup.mangoCache,
      mangoAccount.publicKey,
      rootbank,
      nodeBank,
      vault,
      wrappedSolAccount?.publicKey ?? tokenAcc.publicKey,
      nativeQuantity,
    );

    transaction.add(instruction);

    if (wrappedSolAccount) {
      transaction.add(
        closeAccount({
          source: wrappedSolAccount.publicKey,
          destination: owner.publicKey,
          owner: owner.publicKey,
        }),
      );
    }
}





