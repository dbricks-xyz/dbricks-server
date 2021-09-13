import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import { getVaultOwnerAndNonce } from '@project-serum/swap/lib/utils';
import BN from 'bn.js';
import { Market } from '@project-serum/serum';
import { SerumClient } from './serum.client';
import { loadKpSync } from '../../common/util/common.util';
import { SERUM_PROG_ID, TESTING_KP_PATH } from '../../config/config';
import {
  ixAndSigners,
  orderType,
  side,
} from '../../common/interfaces/dex/common.interfaces.dex.order';

export class SerumClientTester extends SerumClient {
  testingKp: Keypair;

  baseMint?: Token;

  quoteMint?: Token;

  marketKp?: Keypair;

  market?: Market;

  baseVaultPk?: PublicKey;

  quoteVaultPk?: PublicKey;

  baseUserPk?: PublicKey;

  quoteUserPk?: PublicKey;

  baseUser2Pk?: PublicKey;

  quoteUser2Pk?: PublicKey;

  constructor() {
    super();
    this.testingKp = loadKpSync(TESTING_KP_PATH);
  }

  get testingPk() {
    return this.testingKp.publicKey;
  }

  async initMarket() {
    // await this.connection.requestAirdrop(this.testingPk, 10 * LAMPORTS_PER_SOL);

    console.log('Generating mints');
    this.baseMint = await this._createMint(this.testingKp);
    this.quoteMint = await this._createMint(this.testingKp);

    console.log('Generating state accounts');
    const [prepIxs, prepKps] = await this.prepStateAccsForNewMarket(this.testingPk);
    this.marketKp = prepKps[0];
    await this._prepareAndSendTx(
      prepIxs,
      [this.testingKp, ...prepKps],
    );

    // create the vault signer PDA
    // (!) IMPORTANT - must use this function and not do manually
    // otherwise will get an error: Provided seeds do not result in a valid address
    // see my question in Serum's dev-questions chat
    const [vaultSignerPk, vaultSignerNonce] = await getVaultOwnerAndNonce(
      prepKps[0].publicKey,
      SERUM_PROG_ID,
    );

    console.log('Generating token accounts');
    // vaults
    this.baseVaultPk = await this._createTokenAcc(this.baseMint, vaultSignerPk as PublicKey);
    this.quoteVaultPk = await this._createTokenAcc(this.quoteMint, vaultSignerPk as PublicKey);
    // user 1
    this.baseUserPk = await this._createTokenAcc(this.baseMint, this.testingPk);
    this.quoteUserPk = await this._createTokenAcc(this.quoteMint, this.testingPk);
    await this._fundTokenAcc(this.quoteMint, this.testingPk, this.quoteUserPk, 1000);
    // user 2
    this.baseUser2Pk = await this._createTokenAcc(this.baseMint, this.testingPk);
    this.quoteUser2Pk = await this._createTokenAcc(this.quoteMint, this.testingPk);
    await this._fundTokenAcc(this.baseMint, this.testingPk, this.baseUser2Pk, 1000);

    console.log('Preparing InitMarket ix');
    const [ixM, signersM] = await this.prepInitMarketTx(
      this.marketKp.publicKey,
      prepKps[1].publicKey,
      prepKps[2].publicKey,
      prepKps[3].publicKey,
      prepKps[4].publicKey,
      this.baseVaultPk,
      this.quoteVaultPk,
      this.baseMint.publicKey,
      this.quoteMint.publicKey,
      new BN(1),
      new BN(1),
      new BN(50),
      vaultSignerNonce as BN,
      new BN(100),
    );

    await this._prepareAndSendTx(
      ixM,
      [this.testingKp, ...signersM],
    );
    console.log('Successfully initialized a new Serum market');

    this.market = await this.loadSerumMarketFromPk(
      this.marketKp.publicKey,
    );
  }

  async placeAndSettleOrder(side: side, price: number, size: number, payerPk: PublicKey) {
    const [ixO, signersO] = await this.prepPlaceOrderTx(
      this.market as Market,
      side,
      price,
      size,
      'limit',
      this.testingPk,
      payerPk,
    );
    await this._prepareAndSendTx(
      [...ixO],
      [this.testingKp, ...signersO],
    );

    const [ixS, signersS] = await this.prepSettleFundsTx(
      this.market as Market,
      this.testingPk,
      this.baseUserPk as PublicKey,
      this.quoteUserPk as PublicKey,
    );
    const [ixS2, signersS2] = await this.prepSettleFundsTx(
      this.market as Market,
      this.testingPk,
      this.baseUser2Pk as PublicKey,
      this.quoteUser2Pk as PublicKey,
    );
    await this._prepareAndSendTx(
      [...ixS, ...ixS2],
      [this.testingKp, ...signersS, ...signersS2],
    );

    console.log(`${side} order for ${size} at ${price}$ placed`);
  }

  async cancelOrder(orderId: BN) {
    const [ixC, signersC] = await this.prepCancelOrderTx(
      this.market as Market,
      this.testingPk,
      orderId,
    );

    await this._prepareAndSendTx(
      ixC,
      [this.testingKp],
    );
  }
}
