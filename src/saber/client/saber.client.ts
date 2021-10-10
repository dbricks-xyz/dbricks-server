import debug from 'debug';
import { calculateEstimatedSwapOutputAmount, ExchangeBasic, loadExchangeInfo, makeExchange, StableSwap, StableSwapState, SwapTokenInfo } from '@saberhq/stableswap-sdk';
import { instructionsAndSigners, Saber } from '@dbricks/dbricks-ts';
import { findQuarryAddress, MineWrapper, QuarrySDK, QuarryWrapper, QUARRY_ADDRESSES } from '@quarryprotocol/quarry-sdk';
import { SingleConnectionBroadcaster, SolanaProvider as SaberProvider, TransactionEnvelope } from '@saberhq/solana-contrib';
import { TokenAmount, Token as SaberToken, parseBigintIsh } from '@saberhq/token-utils';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { Wallet, Program, Provider as AnchorProvider } from '@project-serum/anchor';
import * as fs from 'fs';
import SolClient from '../../common/client/common.client';
import { SABER_SWAP_PROG_ID, TESTING_KEYPAIR_PATH } from '../../config/config';
import { ISaberPoolDepositParamsParsed, ISaberPoolWithdrawParamsParsed, ISaberSwapParamsParsed } from '../interfaces/saber.interfaces.pool';
import { ISaberFarmDepositParamsParsed } from '../interfaces/saber.interfaces.farm';
import { loadKeypairSync } from '../../common/util/common.util';
import { RegistryToken, SaberPoolInfo } from '../interfaces/saber.interfaces.SaberPoolInfo';

const log: debug.IDebugger = debug('app:saber-client');

export type WrappedTokenPair = {
  underlyingPubkey: PublicKey;
  wrappedPubkey: PublicKey;
};

export default class SaberClient extends SolClient {
  providers: {saberProvider: SaberProvider, anchorProvider: AnchorProvider};

  rewarderKey: PublicKey = new PublicKey('rXhAofQCT7NN9TUqigyEAUzV1uLL4boeD8CRkNBSkYk');

  sdk: QuarrySDK;

  decimalProgram: Program;

  poolRegistry: SaberPoolInfo[];

  constructor() {
    super();
    this.providers = this.loadProviders();
    this.sdk = QuarrySDK.load({
      provider: this.providers.saberProvider,
    });

    this.decimalProgram = this.loadDecimalProgram();
    this.poolRegistry = JSON.parse(fs.readFileSync('./mainnetPools.json', 'utf-8')).pools;

    log('Initialized Saber client');
  }

  loadDecimalProgram(): Program {
    // Read the generated IDL.
    const idl = JSON.parse(fs.readFileSync('./addDecimals.json', 'utf-8'));
    // Address of the deployed program.
    const programId = new PublicKey('DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB');
    // Generate the program client from IDL.
    return new Program(idl, programId, this.providers.anchorProvider);
  }

  loadProviders(): {saberProvider: SaberProvider, anchorProvider: AnchorProvider} {
    const dummyWallet = new Wallet(Keypair.generate()); // Problem?
    // Wallet should never actually be used to sign

    const saberProvider = new SaberProvider(this.connection,
      new SingleConnectionBroadcaster(this.connection),
      dummyWallet);

    const anchorProvider = new AnchorProvider(this.connection, dummyWallet, {});
    return {saberProvider, anchorProvider};
  }

  async getIntegerAmount(uiAmount: number, mintPubkey: PublicKey): Promise<u64> {
    const {decimals} = await this.deserializeTokenMint(mintPubkey);
    return new u64(uiAmount * (10 ** decimals));
  }

  getPoolTokenInfo(swapPubkey: PublicKey, state: StableSwapState): RegistryToken[] {
    const poolInfo = this.poolRegistry.find(
      (pool) => pool.swap.config.swapAccount === swapPubkey.toBase58(),
    );
    if (!poolInfo) {
      throw new Error(`Could not find Saber pool account : ${swapPubkey.toBase58()}`);
    }
    const tokenAInfo = poolInfo.tokens.find(
      (tokenInfo) => tokenInfo.address === state.tokenA.mint.toBase58(),
    );
    if (!tokenAInfo) {
      throw new Error(`Could not find Saber token info for : ${state.tokenA.mint.toBase58()}`);
    }
    const tokenBInfo = poolInfo.tokens.find(
      (tokenInfo) => tokenInfo.address === state.tokenB.mint.toBase58(),
    );
    if (!tokenBInfo) {
      throw new Error(`Could not find Saber token info for : ${state.tokenB.mint.toBase58()}`);
    }
    return [tokenAInfo, tokenBInfo];
  }

  createWrapPair(tokenInfo: RegistryToken): WrappedTokenPair {
    return {
      wrappedPubkey: new PublicKey(tokenInfo.address),
      underlyingPubkey: new PublicKey(tokenInfo.extensions.underlyingTokens[0]),
    };
  }

  async getOrCreatePoolPubkeysTransaction(ownerPubkey: PublicKey, state: StableSwapState):
   Promise<[instructionsAndSigners, PublicKey[]]> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    const [ownerAPubkeyInstructionsAndSigners, ownerAPubkey] =
    await this.getOrCreateAssociatedTokenAccountByMint(
      ownerPubkey,
      state.tokenA.mint,
    );
    const [ownerBPubkeyInstructionsAndSigners, ownerBPubkey] =
    await this.getOrCreateAssociatedTokenAccountByMint(
      ownerPubkey,
      state.tokenB.mint,
    );
    const [ownerPoolPubkeyInstructionsAndSigners, ownerPoolPubkey] =
      await this.getOrCreateAssociatedTokenAccountByMint(
        ownerPubkey,
        state.poolTokenMint,
      );

    instructionsAndSigners.instructions.push(...ownerAPubkeyInstructionsAndSigners.instructions);
    instructionsAndSigners.instructions.push(...ownerBPubkeyInstructionsAndSigners.instructions);
    instructionsAndSigners.instructions.push(...ownerPoolPubkeyInstructionsAndSigners.instructions);
    instructionsAndSigners.signers.push(...ownerAPubkeyInstructionsAndSigners.signers);
    instructionsAndSigners.signers.push(...ownerBPubkeyInstructionsAndSigners.signers);
    instructionsAndSigners.signers.push(...ownerPoolPubkeyInstructionsAndSigners.signers);

    return [instructionsAndSigners, [ownerAPubkey, ownerBPubkey, ownerPoolPubkey]];
  }

  async createWrapOrUnwrapInstruction(
    ownerPubkey: PublicKey,
    ownerWrappedPubkey: PublicKey,
    wrapPair: WrappedTokenPair,
    uiAmount: number,
    type: 'wrap' | 'unwrap',
  ): Promise<instructionsAndSigners> {
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    const [ownerUnderlyingPubkeyInstructionsAndSigners, ownerUnderlyingPubkey] =
    await this.getOrCreateAssociatedTokenAccountByMint(
      ownerPubkey,
      wrapPair.underlyingPubkey,
    );

    const wrapperPubkey = await this.deserializeTokenMint(wrapPair.wrappedPubkey);
    if (!wrapperPubkey.mintAuthority) {
      throw new Error(`Could not find token accounts for: ${wrapPair.underlyingPubkey.toBase58()}`);
    }

    const [blankInstructionsAndSigners, wrapperUnderlyingPubkey] =
    await this.getOrCreateTokenAccountByMint(
      wrapperPubkey.mintAuthority,
      wrapPair.underlyingPubkey,
    );

    const accounts = {
      wrapper: wrapperPubkey.mintAuthority,
      wrapperMint: wrapPair.wrappedPubkey,
      wrapperUnderlyingTokens: wrapperUnderlyingPubkey,
      owner: ownerPubkey,
      userUnderlyingTokens: ownerUnderlyingPubkey,
      userWrappedTokens: ownerWrappedPubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
    };

    let amount: u64;
    let wrapOrUnwrapInstruction: TransactionInstruction;
    if (type === 'wrap') {
      amount = await this.getIntegerAmount(uiAmount, wrapPair.underlyingPubkey);
      wrapOrUnwrapInstruction = this.decimalProgram.instruction.deposit(amount, { accounts });
    } else {
      amount = await this.getIntegerAmount(uiAmount, wrapPair.wrappedPubkey);
      wrapOrUnwrapInstruction = this.decimalProgram.instruction.withdraw(amount, { accounts });
    }

    instructionsAndSigners.instructions.push(...ownerUnderlyingPubkeyInstructionsAndSigners.instructions);
    instructionsAndSigners.instructions.push(wrapOrUnwrapInstruction);

    instructionsAndSigners.signers.push(...ownerUnderlyingPubkeyInstructionsAndSigners.signers);
    return instructionsAndSigners;
  }

  async preparePoolDepositTransaction(
    params: ISaberPoolDepositParamsParsed,
  ): Promise<instructionsAndSigners> {
    const stableSwap = await StableSwap.load(
      this.connection,
      params.swapPubkey,
      SABER_SWAP_PROG_ID,
    );
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };

    const { config, state } = stableSwap;
    const [tokenAInfo, tokenBInfo] = this.getPoolTokenInfo(params.swapPubkey, state);

    const [getOrCreatePoolPubkeysInstructionsAndSigners,
      [ownerAPubkey, ownerBPubkey, ownerPoolPubkey],
    ] = await this.getOrCreatePoolPubkeysTransaction(params.ownerPubkey, state);
    instructionsAndSigners.instructions.push(...getOrCreatePoolPubkeysInstructionsAndSigners.instructions);
    instructionsAndSigners.signers.push(...getOrCreatePoolPubkeysInstructionsAndSigners.signers);

    // If tokenInfo has underlying tokens, need a wrapped deposit transaction
    if (tokenAInfo.tags.includes('saber-decimal-wrapped')) { 
      const wrapPair = this.createWrapPair(tokenAInfo);
      const wrappedDepositInstructionsAndSigners = await
      this.createWrapOrUnwrapInstruction(params.ownerPubkey, ownerAPubkey, wrapPair, params.tokenAmountA, 'wrap');
      instructionsAndSigners.instructions.push(...wrappedDepositInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...wrappedDepositInstructionsAndSigners.signers);
    }

    if (tokenBInfo.tags.includes('saber-decimal-wrapped')) {
      const wrapPair = this.createWrapPair(tokenBInfo);
      const wrappedDepositInstructionsAndSigners = await
      this.createWrapOrUnwrapInstruction(params.ownerPubkey, ownerBPubkey, wrapPair, params.tokenAmountB, 'wrap');
      instructionsAndSigners.instructions.push(...wrappedDepositInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...wrappedDepositInstructionsAndSigners.signers);
    }

    const depositAmountA = await this.getIntegerAmount(params.tokenAmountA, state.tokenA.mint);
    const depositAmountB = await this.getIntegerAmount(params.tokenAmountB, state.tokenB.mint);
    const depositParams = {
      config,
      userAuthority: params.ownerPubkey,
      sourceA: ownerAPubkey,
      sourceB: ownerBPubkey,
      tokenAccountA: state.tokenA.reserve,
      tokenAccountB: state.tokenB.reserve,
      poolTokenMint: state.poolTokenMint,
      poolTokenAccount: ownerPoolPubkey,
      tokenAmountA: depositAmountA,
      tokenAmountB: depositAmountB,
      minimumPoolTokenAmount: new u64(0), // Minimum LP Token user would accept back (used to control slippage) Seems fine at 0
    };
    const depositInstruction = stableSwap.deposit(depositParams);
    instructionsAndSigners.instructions.push(depositInstruction);

    return instructionsAndSigners;
  }

  async preparePoolWithdrawTransaction(
    params: ISaberPoolWithdrawParamsParsed,
  ): Promise<instructionsAndSigners> {
    const stableSwap = await StableSwap.load(
      this.connection,
      params.swapPubkey,
      SABER_SWAP_PROG_ID,
    );
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };

    const { config, state } = stableSwap;
    const [tokenAInfo, tokenBInfo] = this.getPoolTokenInfo(params.swapPubkey, state);

    const [getOrCreatePoolPubkeysInstructionsAndSigners,
      [ownerAPubkey, ownerBPubkey, ownerPoolPubkey],
    ] = await this.getOrCreatePoolPubkeysTransaction(params.ownerPubkey, state);
    instructionsAndSigners.instructions.push(...getOrCreatePoolPubkeysInstructionsAndSigners.instructions);
    instructionsAndSigners.signers.push(...getOrCreatePoolPubkeysInstructionsAndSigners.signers);

    const withdrawingTokenA = params.withdrawMintPubkey.toBase58() === tokenAInfo.address;
    const withdrawTokenInfo = withdrawingTokenA ? tokenAInfo : tokenBInfo;
    const baseToken = withdrawingTokenA ? state.tokenA : state.tokenB;
    const quoteToken = withdrawingTokenA ? state.tokenB : state.tokenA;
    const ownerTokenPubkey = withdrawingTokenA ? ownerAPubkey : ownerBPubkey;

    const poolTokenAmount = await this.getIntegerAmount(params.poolTokenAmount, state.poolTokenMint);
    const withdrawParams = {
      config,
      userAuthority: params.ownerPubkey,
      poolMint: state.poolTokenMint,
      sourceAccount: ownerPoolPubkey,
      baseTokenAccount: baseToken.reserve,
      quoteTokenAccount: quoteToken.reserve,
      destinationAccount: ownerTokenPubkey,
      adminDestinationAccount: baseToken.adminFeeAccount,
      poolTokenAmount,
      minimumTokenAmount: new u64(0), // Used to control slippage
    };

    // Saber UI only uses withdraw one
    const withdrawInstruction = stableSwap.withdrawOne(withdrawParams);
    instructionsAndSigners.instructions.push(withdrawInstruction);

    // If tokenInfo has underlying tokens, need a unwrap withdrawal transaction
    if (withdrawTokenInfo.tags.includes('saber-decimal-wrapped')) {
      const wrapPair = this.createWrapPair(withdrawTokenInfo);
      const wrappedWithdrawInstructionsAndSigners = await
      this.createWrapOrUnwrapInstruction(params.ownerPubkey, ownerTokenPubkey, wrapPair, params.poolTokenAmount, 'unwrap');
      instructionsAndSigners.instructions.push(...wrappedWithdrawInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...wrappedWithdrawInstructionsAndSigners.signers);
    }

    return instructionsAndSigners;
  }

  async preparePoolSwapTransaction(
    params: ISaberSwapParamsParsed,
  ):Promise<instructionsAndSigners> {
    const stableSwap = await StableSwap.load(
      this.connection,
      params.swapPubkey,
      SABER_SWAP_PROG_ID,
    );
    const instructionsAndSigners: instructionsAndSigners = {
      instructions: [],
      signers: [],
    };
    const { config, state } = stableSwap;
    const [tokenAInfo, tokenBInfo] = this.getPoolTokenInfo(params.swapPubkey, state);

    const swappingTokenA = params.payingMintPubkey.toBase58() === tokenAInfo.address;
    const swappingTokenInfo = swappingTokenA ? tokenAInfo : tokenBInfo;
    const receivingTokenInfo = swappingTokenA ? tokenBInfo : tokenAInfo;
    const payingToken = swappingTokenA ? state.tokenA : state.tokenB;
    const receivingToken = swappingTokenA ? state.tokenB : state.tokenA;

    const [ownerPayingPubkeyInstructionsAndSigners, ownerPayingPubkey] =
      await this.getOrCreateAssociatedTokenAccountByMint(
        params.ownerPubkey,
        payingToken.mint,
      );
    instructionsAndSigners.instructions.push(...ownerPayingPubkeyInstructionsAndSigners.instructions);
    instructionsAndSigners.signers.push(...ownerPayingPubkeyInstructionsAndSigners.signers);

    const [ownerReceivingPubkeyInstructionsAndSigners, ownerReceivingPubkey] =
      await this.getOrCreateAssociatedTokenAccountByMint(
        params.ownerPubkey,
        receivingToken.mint,
      );
    instructionsAndSigners.instructions.push(...ownerReceivingPubkeyInstructionsAndSigners.instructions);
    instructionsAndSigners.signers.push(...ownerReceivingPubkeyInstructionsAndSigners.signers);

    if (swappingTokenInfo.tags.includes('saber-decimal-wrapped')) {
      const wrapPair = this.createWrapPair(swappingTokenInfo);
      const wrappedDepositInstructionsAndSigners = await
      this.createWrapOrUnwrapInstruction(params.ownerPubkey, ownerPayingPubkey, wrapPair, params.swapAmount, 'wrap');
      instructionsAndSigners.instructions.push(...wrappedDepositInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...wrappedDepositInstructionsAndSigners.signers);
    }
    // assume amountIn is unchanged via wrapping, same as deposit
    const amountIn = await this.getIntegerAmount(params.swapAmount, payingToken.mint);

    const swapParams = {
      config,
      userAuthority: params.ownerPubkey,
      userSource: ownerPayingPubkey,
      poolSource: payingToken.reserve,
      poolDestination: receivingToken.reserve,
      userDestination: ownerReceivingPubkey,
      adminDestination: receivingToken.adminFeeAccount,
      amountIn,
      minimumAmountOut: new u64(0), // Used for slippage control
    };

    const swapInstruction = stableSwap.swap(swapParams);
    instructionsAndSigners.instructions.push(swapInstruction);

    if (receivingTokenInfo.tags.includes('saber-decimal-wrapped')) {
      const wrapPair = this.createWrapPair(receivingTokenInfo);
      const wrappedWithdrawInstructionsAndSigners = await
      this.createWrapOrUnwrapInstruction(params.ownerPubkey, ownerReceivingPubkey, wrapPair, params.swapAmount, 'unwrap');
      instructionsAndSigners.instructions.push(...wrappedWithdrawInstructionsAndSigners.instructions);
      instructionsAndSigners.signers.push(...wrappedWithdrawInstructionsAndSigners.signers);
    }

    return instructionsAndSigners;
  }

  async prepareFarmDepositTransaction(
    params: ISaberFarmDepositParamsParsed,
  ): Promise<instructionsAndSigners> {
    const tokenDecimals = (await this.deserializeTokenMint(params.mintPubkey)).decimals;
    const poolToken = SaberToken.fromMint(params.mintPubkey, tokenDecimals);

    const quarry = await this.loadQuarry(poolToken);
    const minerActions = await quarry.getMinerActions(
      params.ownerPubkey,
    );

    const depositAmount = params.depositAmount * (10 ** tokenDecimals);
    const tokenAmount = new TokenAmount(poolToken, parseBigintIsh(depositAmount));

    const stakeTransaction: TransactionEnvelope = minerActions
      .stake(tokenAmount);

    console.log(stakeTransaction.signers);

    return {
      instructions: [
        ...stakeTransaction.instructions,
      ],
      signers: [],
    };
  }

  async loadQuarry(poolToken: SaberToken): Promise<QuarryWrapper> {
    const [quarryKey] = await findQuarryAddress(
      this.rewarderKey,
      poolToken.mintAccount,
      QUARRY_ADDRESSES.Mine,
    );

    return QuarryWrapper.load({
      sdk: this.sdk,
      token: poolToken,
      key: quarryKey,
    });
  }

  // async loadSaberToken(mintPubkey: PublicKey): Promise<SaberToken> {
  //   SaberToken.fromMint(mintPubkey, )

  //   const tokenProvider = await new TokenListProvider().resolve();
  //   const tokenList = tokenProvider.filterByClusterSlug('mainnet-beta').getList();
  //   const tokenInfo = tokenList.find((t) => t.address === mintPubkey.toBase58());
  //   if (!tokenInfo) {
  //     throw new Error(`Could not find token with mint address: ${mintPubkey.toBase58()}`);
  //   }
  //   return new SaberToken(tokenInfo);
  // }
}
