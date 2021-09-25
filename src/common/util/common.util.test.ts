import {
  loadKpSync,
  mergeIxsAndSigners,
  tryGetMintName, tryGetMintPk,
  tryGetSerumMarketName,
  tryGetSerumMarketPk
} from "./common.util";
import {ixsAndSigners} from "dbricks-lib";
import {TESTING_KP_PATH} from "../../config/config";
import SerumClient from "../../serum/client/serum.client";
import {Keypair, PublicKey} from "@solana/web3.js";

describe('Util', () => {
  it('merges ixsAndSigners (actual ixs)', async () => {
    // I need some real instructions, this looks like the simplest route
    const testingKp = loadKpSync(TESTING_KP_PATH);
    const stateAccKp = new Keypair();
    const srm = new SerumClient();
    const ix = await srm.prepCreateStateAccIx(stateAccKp.publicKey, 123, testingKp.publicKey);
    const iAndS1: ixsAndSigners = {
      instructions: [ix],
      signers: [testingKp, stateAccKp]
    }
    const iAndS2: ixsAndSigners = {...iAndS1};
    const iAndS3: ixsAndSigners = {...iAndS1};

    const expected: ixsAndSigners = {
      instructions: [...iAndS1.instructions, ...iAndS2.instructions, ...iAndS3.instructions],
      signers: [...iAndS1.signers],
    }
    let actual = mergeIxsAndSigners(iAndS1, iAndS2);
    actual = mergeIxsAndSigners(actual, iAndS3);
    expect(actual).toEqual(expected);
  })

  it('merges ixsAndSigners (numbers)', () => {
    const x: ixsAndSigners = {
      instructions: [1 as any, 2 as any],
      signers: [1 as any, 2 as any],
    }
    const y: ixsAndSigners = {
      instructions: [2 as any, 3 as any],
      signers: [2 as any, 3 as any],
    }
    const expected: ixsAndSigners = {
      instructions: [1 as any, 2 as any, 2 as any, 3 as any],
      signers: [1 as any, 2 as any, 3 as any],
    }
    const actual = mergeIxsAndSigners(x, y);
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
    const name = tryGetSerumMarketPk("USDT/USDC");
    expect(name?.toBase58()).toEqual("77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS");
    const name2 = tryGetSerumMarketPk("doesnt_exist");
    expect(name2).toEqual(undefined);
  })

  it('gets mint pk', () => {
    const name = tryGetMintPk("COPE");
    expect(name?.toBase58()).toEqual("8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh");
    const name2 = tryGetMintPk("doesnt_exist");
    expect(name2).toEqual(undefined);
  })
})