# Local deployment
1. Install latest rust as recommended online
2. [Install solana-cli](https://docs.solana.com/cli/install-solana-cli-tools)
3. Create a new local keypair file - `solana-keygen new`. It will be placed in a path similar to `/Users/ilmoi/.config/solana/id.json`
4. Install the protocols we're going to be working with on localnet:
```shell
# in a separate window
solana-test-validator # this sets up a local validator. You can add --reset to reset the state
# git clone the protocols below
https://github.com/project-serum/serum-dex
https://github.com/blockworks-foundation/mango
# for each protocol cd into the folder with `Cargo.toml` (note for serum you MUST cd into `dex`, not the root folder)
cargo-build bpf
# this will produce a command to deploy the protocol - copy paste it into terminal. Eg:
solana program deploy /Users/ilmoi/Dropbox/crypto_bc/sol/mango/mango-repo/program/target/deploy/mango.so
# at the end you'll get back the program id. You'll need it for next step
```
5. Create a .env inside the dir and add the following, substituting as necessary for your machine:
```dotenv
NETWORK=mainnet
KEYPAIR_PATH=/Users/ilmoi/.config/solana/id.json
LOCAL_SERUM_PROG_ID = DVieqxNimmtbZpZTw2sZiSAohNJuHLywGaMs47RAW97Z
LOCAL_MANGO_PROG_ID = B9VhwgQUzrGPdPGkzHNxEfGtXzV7YxBPytjFAka5dsCZ
# obviously your path / id will be different
```
6. Now you're ready to launch the node server:
```shell
yarn
yarn update # (pulls latest dbricks lib)
yarn debug
```

# Architecture

Currently:
- `SolClient` = parent, contains functionality needed to interact with Solana blockchain
  - `Protocol1CLient` = child, inherits above + implements protocol specific functionality. Functions should be pure and testable on their own as much as possible
  - `Protocol2CLient` = etc
  - `Protocol3CLient` = etc
    - `Protocol3Service1` = groups together pure functions to achieve a particular goal (eg place an order on Serum)
    - `Protocol3Service2` = etc
    - `Protocol3Service3` = etc

# Testing

Currently:
- unit tests go in the same folder as the file they're testing (see `src/common/util/util.test` for example)
- e2e tests go in the top level folder - will have both protocol-specific e2e and cross-protocol there

Pay attention to which network you're on for testing. The below 2 can be used to overwrite the network specified in `.env`:
- `export TESTING_LOCAL=1`
- `export TESTING_DEV=1`

Commands to run tests:
```shell
yarn test:local #on localnet
yarn test:dev #on devnet
```

Any function that beings with an underscore is designed for testing *only*. Not to be used in actual prod code.