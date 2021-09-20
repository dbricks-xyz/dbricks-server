import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram, Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import {DexInstructions, Market, TokenInstructions} from '@project-serum/serum';
import debug from 'debug';
import {Order} from '@project-serum/serum/lib/market';
import {
  ixsAndSigners,
  orderType,
  side,
} from 'dbricks-lib';
import SolClient from '../../common/client/common.client';
import {SERUM_PROG_ID} from '../../config/config';
import {tryGetSerumMarketName} from "../../common/util/common.util";

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
    vaultNonce: BN,
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
      vaultSignerNonce: vaultNonce,
      quoteDustThreshold,
      programId: SERUM_PROG_ID,
      // todo add
      // authority = undefined,
      // pruneAuthority = undefined,
    });
    return {
      ixs: [initMarketIx],
      signers: [],
    };
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
    return {
      ixs: [...placeOrderTx.transaction.instructions],
      signers: [...placeOrderTx.signers],
    }
  }

  async prepCancelOrderTx(
    market: Market,
    ownerPk: PublicKey,
    orderId?: BN,
  ): Promise<ixsAndSigners> {
    let orders;
    //fail to load
    try {
      orders = await market.loadOrdersForOwner(
        this.connection,
        ownerPk,
      );
    } catch (e) {
      log('failed to load open orders', e);
      return {ixs: [], signers: []};
    }
    //none returned
    if (orders.length === 0) {
      return {ixs: [], signers: []};
    }
    //if specific order id passed
    if (orderId) {
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
      return {
        ixs: [...cancelOrderTx.instructions],
        signers: [],
      }
    }
    //else just cancel all
    //todo note this will fail if too many orders outstanding, need to split
    const ixs: TransactionInstruction[] = [];
    orders.forEach(async (o) => {
      const cancelOrderTx = await market.makeCancelOrderTransaction(
        this.connection,
        ownerPk,
        o,
      );
      ixs.push(...cancelOrderTx.instructions)
    })
    return {
      ixs,
      signers: [],
    }
  }

  async prepSettleFundsTx(
    market: Market,
    ownerPk: PublicKey,
    ownerBasePk: PublicKey,
    ownerQuotePk: PublicKey,
  ): Promise<ixsAndSigners> {
    // currently this will fail if this is the first ever trade for this user in this market
    // this means the 1st trade won't settle and we have to run this twice to actually settle it
    const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
      this.connection, ownerPk,
    );
    if (openOrdersAccounts.length === 0) {
      return {ixs: [], signers: []};
    }
    const settleFundsTx = await market.makeSettleFundsTransaction(
      this.connection,
      openOrdersAccounts[0],
      ownerBasePk,
      ownerQuotePk,
    );
    return {
      ixs: [...settleFundsTx.transaction.instructions],
      signers: [...settleFundsTx.signers],
    }
  }

  async getBaseQuoteFromMarket(marketPk: string): Promise<[string, string]> {
    const marketName = tryGetSerumMarketName(marketPk);
    console.log('naaame', marketName)
    if (marketName) {
      return marketName.split('/') as [string, string];
    }
    try {
      const market = await this.loadSerumMarket(new PublicKey(marketPk));
      return [
        market.baseMintAddress.toBase58()
          .substring(0, 5),
        market.quoteMintAddress.toBase58()
          .substring(0, 5),
      ];
    } catch (e) {
      //todo need better err handling
      return ['X', 'Y'];
    }
  }

  // --------------------------------------- helpers (passive)

  async getPayerForMarket(
    market: Market,
    side: side,
    ownerPk: PublicKey,
  ): Promise<[ixsAndSigners, PublicKey]> {
    if (side === 'buy') {
      return this.getOrCreateTokenAccByMint(
        this.connection, market, ownerPk, market.quoteMintAddress,
      );
    } else {
      return this.getOrCreateTokenAccByMint(
        this.connection, market, ownerPk, market.baseMintAddress,
      );
    }
  }

  async getBaseAndQuoteAccsFromMarket(
    market: Market,
    ownerPk: PublicKey,
  ): Promise<[ixsAndSigners, PublicKey][]> {
    const [ownerBaseIxsAndSigners, ownerBasePk] = await this.getOrCreateTokenAccByMint(
      this.connection, market, ownerPk, market.baseMintAddress,
    );
    const [ownerQuoteIxsAndSigners, ownerQuotePk] = await this.getOrCreateTokenAccByMint(
      this.connection, market, ownerPk, market.quoteMintAddress,
    );
    return [
      [ownerBaseIxsAndSigners, ownerBasePk],
      [ownerQuoteIxsAndSigners, ownerQuotePk],
    ];
  }

  async loadSerumMarket(
    marketPk: PublicKey,
  ): Promise<Market> {
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
    lotSize: number,
    tickSize: number,
    baseMintPk: PublicKey,
    quoteMintPk: PublicKey,
  ): Promise<[BN, BN]> {
    let baseLotSize;
    let quoteLotSize;

    const baseMintInfo = await this.deserializeTokenMint(baseMintPk);
    const quoteMintInfo = await this.deserializeTokenMint(quoteMintPk);

    if (baseMintInfo && lotSize > 0) {
      baseLotSize = Math.round(10 ** baseMintInfo.decimals * lotSize);
      if (quoteMintInfo && tickSize > 0) {
        quoteLotSize = Math.round(lotSize * 10 ** quoteMintInfo.decimals * tickSize);
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
    mintPk: PublicKey,
  ): Promise<[ixsAndSigners, PublicKey]> {
    let ixsAndSigners: ixsAndSigners = {ixs: [], signers: []};
    let tokenAccPk: PublicKey;
    if (mintPk.toBase58() === 'So11111111111111111111111111111111111111112') {
      return [ixsAndSigners, ownerPk];
    }
    const tokenAccounts = await market.getTokenAccountsByOwnerForMint(
      connection, ownerPk, mintPk,
    );

    if (tokenAccounts.length === 0) {
      log(`Creating token account for mint ${mintPk.toBase58()}`);
      [ixsAndSigners, tokenAccPk] = await this.prepCreateTokenAccTx(ownerPk, mintPk);
    } else {
      tokenAccPk = tokenAccounts[0].pubkey;
    }
    log(`User's account for mint ${mintPk.toBase58()} is ${tokenAccPk.toBase58()}`);

    return [ixsAndSigners, tokenAccPk];
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
  ): Promise<ixsAndSigners> {
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

    return {
      ixs: [marketIx, reqQIx, eventQIx, bidsIx, asksIx],
      signers: [marketKp, reqQKp, eventQKp, bidsKp, asksKp],
    }
  }

  async prepVaultAccs(
    vaultOwnerPk: PublicKey,
    baseMint: PublicKey,
    quoteMint: PublicKey,
    ownerPk: PublicKey, // wallet owner
  ): Promise<ixsAndSigners> {
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
        owner: vaultOwnerPk,
      }),
      TokenInstructions.initializeAccount({
        account: quoteVaultKp.publicKey,
        mint: quoteMint,
        owner: vaultOwnerPk,
      }),
    ];
    return {
      ixs,
      signers: [baseVaultKp, quoteVaultKp],
    }
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
    await this._prepareAndSendTx({
      ixs: [consumeEventsIx],
      signers: [ownerKp],
    });
  }
}
