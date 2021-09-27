import {
  loadKpSync,
  mergeInstructionsAndSigners,
  tryGetMintName, tryGetMintPubkey,
  tryGetSerumMarketName,
  tryGetSerumMarketPubkey
} from "./common.util";
import {instructionsAndSigners} from "dbricks-lib";
import {TESTING_KP_PATH} from "../../config/config";
import SerumClient from "../../serum/client/serum.client";
import {Keypair, PublicKey} from "@solana/web3.js";

describe('Util', () => {
  it('merges instructionsAndSigners (actual instructions)', async () => {
    // I need some real instructions, this looks like the simplest route
    const testingKp = loadKpSync(TESTING_KP_PATH);
    const stateAccKp = new Keypair();
    const srm = new SerumClient();
    const instruction = await srm.prepCreateStateAccInstruction(stateAccKp.publicKey, 123, testingKp.publicKey);
    const iAndS1: instructionsAndSigners = {
      instructions: [instruction],
      signers: [testingKp, stateAccKp]
    }
    const iAndS2: instructionsAndSigners = {...iAndS1};
    const iAndS3: instructionsAndSigners = {...iAndS1};

    const expected: instructionsAndSigners = {
      instructions: [...iAndS1.instructions, ...iAndS2.instructions, ...iAndS3.instructions],
      signers: [...iAndS1.signers],
    }
    let actual = mergeInstructionsAndSigners(iAndS1, iAndS2);
    actual = mergeInstructionsAndSigners(actual, iAndS3);
    expect(actual).toEqual(expected);
  })

  it('merges instructionsAndSigners (numbers)', () => {
    const x: instructionsAndSigners = {
      instructions: [1 as any, 2 as any],
      signers: [1 as any, 2 as any],
    }
    const y: instructionsAndSigners = {
      instructions: [2 as any, 3 as any],
      signers: [2 as any, 3 as any],
    }
    const expected: instructionsAndSigners = {
      instructions: [1 as any, 2 as any, 2 as any, 3 as any],
      signers: [1 as any, 2 as any, 3 as any],
    }
    const actual = mergeInstructionsAndSigners(x, y);
    console.log(actual);
    expect(actual).toEqual(expected);
  })

  it('gets serum market name', () => {
    const name = tryGetSerumMarketName("77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS");
    expect(name).toEqual("USDT/USDC");
    const name2 = tryGetSerumMarketName("doesnt_exist");
    expect(name2).toEqual(undefined);
  })

  it('gets mint name', () => {
    const name = tryGetMintName("8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh");
    expect(name).toEqual("COPE");
    const name2 = tryGetMintName("doesnt_exist");
    expect(name2).toEqual(undefined);
  })

  it('gets serum market pk', () => {
    const name = tryGetSerumMarketPubkey("USDT/USDC");
    expect(name?.toBase58()).toEqual("77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS");
    const name2 = tryGetSerumMarketPubkey("doesnt_exist");
    expect(name2).toEqual(undefined);
  })

  it('gets mint pk', () => {
    const name = tryGetMintPubkey("COPE");
    expect(name?.toBase58()).toEqual("8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh");
    const name2 = tryGetMintPubkey("doesnt_exist");
    expect(name2).toEqual(undefined);
  })
})