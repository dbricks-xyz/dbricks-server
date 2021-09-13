import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram, Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { DexInstructions, Market, TokenInstructions } from '@project-serum/serum';
import debug from 'debug';
import { Order } from '@project-serum/serum/lib/market';
import {
  ixsAndKps,
  ixsAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import SolClient from '../../common/client/common.client';
import { SERUM_PROG_ID } from '../../config/config';
import { getMint, getSerumMarket } from '../../config/config.util';

const log: debug.IDebugger = debug('app:serum-client');

export default class SerumClient extends SolClient {
  constructor() {
    super();
    log('Initialized Serum client');
  }

  async prepInitMarketTx(
    marketPk: PublicKey,
    reqQPk: PublicKey,
    eventQPk: PublicKey,
    bidsPk: PublicKey,
    asksPk: PublicKey,
    baseVaultPk: PublicKey,
    quoteVaultPk: PublicKey,
    baseMintPk: PublicKey,
    quoteMintPk: PublicKey,
    baseLotSize: BN,
    quoteLotSize: BN,
    feeRateBps: BN,
    vaultSignerNonce: BN,
    quoteDustThreshold: BN,
  ): Promise<ixsAndSigners> {
    const initMarketIx = DexInstructions.initializeMarket({
      // dex accounts
      market: marketPk,
      requestQueue: reqQPk,
      eventQueue: eventQPk,
      bids: bidsPk,
      asks: asksPk,
      // vaults
      baseVault: baseVaultPk,
      quoteVault: quoteVaultPk,
      // mints
      baseMint: baseMintPk,
      quoteMint: quoteMintPk,
      // rest
      baseLotSize,
      quoteLotSize,
      feeRateBps,
      vaultSignerNonce,
      quoteDustThreshold,
      programId: SERUM_PROG_ID,
      // todo add
      // authority = undefined,
      // pruneAuthority = undefined,
    });
    return [
      [initMarketIx],
      [],
    ];
  }

  async prepPlaceOrderTx(
    market: Market,
    side: side,
    price: number,
    size: number,
    orderType: orderType,
    ownerPk: PublicKey,
    payerPk: PublicKey,
  ): Promise<ixsAndSigners> {
    const placeOrderTx = await market.makePlaceOrderTransaction(this.connection, {
      owner: ownerPk,
      payer: payerPk,
      side,
      price,
      size,
      orderType,
      feeDiscountPubkey: null, // needed to enable devnet/localnet
    });
    return [
      [...placeOrderTx.transaction.instructions],
      [...placeOrderTx.signers],
    ];
  }

  async prepCancelOrderTx(
    market: Market,
    ownerPk: PublicKey,
    orderId: BN,
  ): Promise<ixsAndSigners> {
    const orders = await market.loadOrdersForOwner(
      this.connection,
      ownerPk,
    );
    if (orders.length === 0) {
      return [[], []];
    }
    const [order] = orders.filter((o: Order) => {
      if (o.orderId.eq(orderId)) {
        return o;
      }
    });
    const cancelOrderTx = await market.makeCancelOrderTransaction(
      this.connection,
      ownerPk,
      order,
    );
    return [
      [...cancelOrderTx.instructions],
      [],
    ];
  }

  async prepSettleFundsTx(
    market: Market,
    ownerPk: PublicKey,
    ownerBasePk: PublicKey,
    ownerQuotePk: PublicKey,
  ): Promise<ixsAndSigners> {
  // todo currently this will fail if this is the first ever trade for this user in this market
  // this means the 1st trade won't settle and we have to run this twice to actually settle it
    const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
      this.connection, ownerPk,
    );
    if (openOrdersAccounts.length === 0) {
      return [[], []];
    }
    const settleFundsTx = await market.makeSettleFundsTransaction(
      this.connection,
      openOrdersAccounts[0],
      ownerBasePk,
      ownerQuotePk,
    );
    return [
      [...settleFundsTx.transaction.instructions],
      [...settleFundsTx.signers],
    ];
  }

  // --------------------------------------- helpers (passive)

  async getPayerFromMarket(
    market: Market,
    marketName: string,
    side: side,
    ownerPk: PublicKey,
  ): Promise<[ixsAndSigners, PublicKey]> {
    let tokenIxAndSigners;
    let payerPk;
    const [base, quote] = marketName.split('/');
    if (side === 'buy') {
      [tokenIxAndSigners, payerPk] = await this.getOrCreateTokenAccByMint(
        this.connection, market, ownerPk, quote,
      );
    } else {
      [tokenIxAndSigners, payerPk] = await this.getOrCreateTokenAccByMint(
        this.connection, market, ownerPk, base,
      );
    }
    return [tokenIxAndSigners, payerPk];
  }

  async getBaseAndQuoteAccsFromMarket(
    market: Market,
    marketName: string,
    ownerPk: PublicKey,
  ): Promise<[ixsAndSigners, PublicKey][]> {
    const [base, quote] = marketName.split('/');
    const [ownerBaseIxAndSigners, ownerBasePk] = await this.getOrCreateTokenAccByMint(
      this.connection, market, ownerPk, base,
    );
    const [ownerQuoteIxAndSigners, ownerQuotePk] = await this.getOrCreateTokenAccByMint(
      this.connection, market, ownerPk, quote,
    );
    return [
      [ownerBaseIxAndSigners, ownerBasePk],
      [ownerQuoteIxAndSigners, ownerQuotePk],
    ];
  }

  async loadSerumMarketFromName(
    name: string,
  ) {
    log(`Market pk for market ${name} is ${getSerumMarket(name)}`);
    return Market.load(this.connection, getSerumMarket(name), {}, SERUM_PROG_ID);
  }

  async loadSerumMarketFromPk(
    marketPk: PublicKey,
  ) {
    return Market.load(this.connection, marketPk, {}, SERUM_PROG_ID);
  }

  async loadOrdersForOwner(
    market: Market,
    ownerPk: PublicKey,
  ): Promise<Order[]> {
    return market.loadOrdersForOwner(
      this.connection,
      ownerPk,
    );
  }

  async calcBaseAndQuoteLotSizes(
    lotSize: string,
    tickSize: string,
    baseMintPk: PublicKey,
    quoteMintPk: PublicKey,
  ): Promise<[BN, BN]> {
    let baseLotSize;
    let quoteLotSize;

    const baseMintInfo = await this.deserializeTokenMint(baseMintPk);
    const quoteMintInfo = await this.deserializeTokenMint(quoteMintPk);

    if (baseMintInfo && parseFloat(lotSize) > 0) {
      baseLotSize = Math.round(10 ** baseMintInfo.decimals * parseFloat(lotSize));
      if (quoteMintInfo && parseFloat(tickSize) > 0) {
        quoteLotSize = Math.round(
          parseFloat(lotSize)
          * 10 ** quoteMintInfo.decimals
          * parseFloat(tickSize),
        );
      }
    }
    if (!baseLotSize || !quoteLotSize) {
      throw new Error(`Failed to calculate base/quote lot sizes from lot size ${lotSize} and tick size ${tickSize}`);
    }

    return [new BN(baseLotSize), new BN(quoteLotSize)];
  }

  // --------------------------------------- helpers (active)

  async getOrCreateTokenAccByMint(
    connection: Connection,
    market: Market,
    ownerPk: PublicKey,
    mintName: string,
  ): Promise<[ixsAndSigners, PublicKey]> {
    let ixAndSigners: ixsAndSigners = [[], []];
    let tokenAccPk: PublicKey;
    if (mintName === 'SOL') {
      return [ixAndSigners, ownerPk];
    }
    const mintPk = getMint(mintName);
    const tokenAccounts = await market.getTokenAccountsByOwnerForMint(
      connection, ownerPk, mintPk,
    );

    if (tokenAccounts.length === 0) {
      log(`Creating token account for mint ${mintName}, ${mintPk.toBase58()}`);
      [ixAndSigners, tokenAccPk] = await this.prepCreateTokenAccTx(ownerPk, mintPk);
    } else {
      tokenAccPk = tokenAccounts[0].pubkey;
    }
    log(`User's account for mint ${mintName} (${mintPk.toBase58()}) is ${tokenAccPk.toBase58()}`);

    return [ixAndSigners, tokenAccPk];
  }

  async prepCreateStateAccIx(
    stateAccPk: PublicKey,
    space: number,
    ownerPk: PublicKey,
  ): Promise<TransactionInstruction> {
    return SystemProgram.createAccount({
      programId: SERUM_PROG_ID,
      fromPubkey: ownerPk,
      newAccountPubkey: stateAccPk,
      space,
      lamports: await this.connection.getMinimumBalanceForRentExemption(space),
    });
  }

  async prepStateAccsForNewMarket(
    ownerPk: PublicKey, // wallet owner
  ) : Promise<ixsAndKps> {
    // do we just throw these away? seems to be the case in their Serum DEX UI
    // https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L475
    const marketKp = new Keypair();
    const reqQKp = new Keypair();
    const eventQKp = new Keypair();
    const bidsKp = new Keypair();
    const asksKp = new Keypair();

    // length taken from here - https://github.com/project-serum/serum-dex/blob/master/dex/crank/src/lib.rs#L1286
    const marketIx = await this.prepCreateStateAccIx(
      marketKp.publicKey, 376 + 12, ownerPk,
    );
    const reqQIx = await this.prepCreateStateAccIx(
      reqQKp.publicKey, 640 + 12, ownerPk,
    );
    const eventQIx = await this.prepCreateStateAccIx(
      eventQKp.publicKey, 1048576 + 12, ownerPk,
    );
    const bidsIx = await this.prepCreateStateAccIx(
      bidsKp.publicKey, 65536 + 12, ownerPk,
    );
    const asksIx = await this.prepCreateStateAccIx(
      asksKp.publicKey, 65536 + 12, ownerPk,
    );

    return [
      [marketIx, reqQIx, eventQIx, bidsIx, asksIx],
      [marketKp, reqQKp, eventQKp, bidsKp, asksKp],
    ];
  }

  async prepVaultAccs(
    vaultSignerPk: PublicKey,
    baseMint: PublicKey,
    quoteMint: PublicKey,
    ownerPk: PublicKey, // wallet owner
  ): Promise<ixsAndKps> {
    const baseVaultKp = new Keypair();
    const quoteVaultKp = new Keypair();

    // as per https://github.com/project-serum/serum-dex-ui/blob/master/src/utils/send.tsx#L519
    const ixs = [
      SystemProgram.createAccount({
        fromPubkey: ownerPk,
        newAccountPubkey: baseVaultKp.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: TokenInstructions.TOKEN_PROGRAM_ID,
      }),
      SystemProgram.createAccount({
        fromPubkey: ownerPk,
        newAccountPubkey: quoteVaultKp.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: TokenInstructions.TOKEN_PROGRAM_ID,
      }),
      TokenInstructions.initializeAccount({
        account: baseVaultKp.publicKey,
        mint: baseMint,
        owner: vaultSignerPk,
      }),
      TokenInstructions.initializeAccount({
        account: quoteVaultKp.publicKey,
        mint: quoteMint,
        owner: vaultSignerPk,
      }),
    ];
    return [
      ixs,
      [baseVaultKp, quoteVaultKp],
    ];
  }

  // --------------------------------------- testing only

  async _consumeEvents(market: Market, ownerKp: Keypair) {
    const openOrders = await market.findOpenOrdersAccountsForOwner(
      this.connection,
      ownerKp.publicKey,
    );
    const consumeEventsIx = market.makeConsumeEventsInstruction(
      openOrders.map((oo) => oo.publicKey), 100,
    );
    await this._prepareAndSendTx(
      [consumeEventsIx],
      [ownerKp],
    );
  }
}
