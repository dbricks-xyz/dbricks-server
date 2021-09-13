Some thoughts on where we are now

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
- unit tests go in the same folder as the file they're testing (see `src/serum/client` for example)
- e2e tests go in the top level folder - will have both protocol-specific e2e and cross-protocol there

Pay attention to which network you're on for testing. The below 2 can be used to overwrite the network specified in `.env`:
- `export TESTING_LOCAL=1`
- `export TESTING_DEV=1`

Any function that beings with an underscore is designed for testing *only*. Not to be used in actual prod code.