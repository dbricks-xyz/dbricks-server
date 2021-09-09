import {
    Connection, Keypair, sendAndConfirmTransaction,
    Signer,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {CONNECTION_URL} from "../../constants/constants";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";

class SolClient {
    connection: Connection;

    constructor() {
        this.connection = new Connection(CONNECTION_URL, 'processed');
    }

    async checkConnection() {
        const version = await this.connection.getVersion();
        console.log('Connection to cluster established:', CONNECTION_URL, version);
    }

    async prepareAndSendTx(instructions: TransactionInstruction[], signers: Signer[]) {
        const tx = new Transaction().add(...instructions);
        const sig = await sendAndConfirmTransaction(this.connection, tx, signers);
        console.log(sig);
    }

    async getTokenAccsForOwner(
        ownerKp: Keypair,
    ) {
        const payerAccs = await this.connection.getParsedTokenAccountsByOwner(
            ownerKp.publicKey,
            {
                programId: TOKEN_PROGRAM_ID,
            }
        )
        payerAccs.value.forEach(a => {
            console.log('// ---------------------------------------')
            console.log(a.pubkey.toBase58())
            console.log(a.account.data.parsed.info)
        })
    }

}

export default new SolClient();