import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { DexInstructions, Market } from '@project-serum/serum';
import debug from 'debug';
import { Order } from '@project-serum/serum/lib/market';
import {
  ixAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';
import { SolClient } from '../../common/client/common.client';
import { SERUM_PROG_ID } from '../../config/config';
import { getMint, getSerumMarket } from '../../config/config.util';

const log: debug.IDebugger = debug('app:serum-client');

export class SerumClient extends SolClient {
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
  ): Promise<ixAndSigners> {
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
  ): Promise<ixAndSigners> {
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
  ): Promise<ixAndSigners> {
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
  ): Promise<ixAndSigners> {
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

  // --------------------------------------- helpers

  async getPayerFromMarket(
    market: Market,
    marketName: string,
    side: side,
    ownerPk: PublicKey,
  ): Promise<[ixAndSigners, PublicKey]> {
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
  ): Promise<[ixAndSigners, PublicKey][]> {
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

  async getOrCreateTokenAccByMint(
    connection: Connection,
    market: Market,
    ownerPk: PublicKey,
    mintName: string,
  ): Promise<[ixAndSigners, PublicKey]> {
    let ixAndSigners: ixAndSigners = [[], []];
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

  async generateCreateStateAccIx(
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

  async consumeEvents(market: Market, ownerKp: Keypair) {
    const openOrders = await market.findOpenOrdersAccountsForOwner(
      this.connection,
      ownerKp.publicKey,
    );
    const consumeEventsIx = market.makeConsumeEventsInstruction(
      openOrders.map((oo) => oo.publicKey), 100,
    );
    await this.prepareAndSendTx(
      [consumeEventsIx],
      [ownerKp],
    );
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
}

export default new SerumClient();
