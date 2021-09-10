
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