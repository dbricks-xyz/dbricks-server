import {mergeIxsAndSigners} from "./common.util";
import {ixsAndSigners} from "dbricks-lib";

describe('Util', () => {
  it('merges ixsAndSigners ok', () => {
    //todo write better tests with actual ix and signers here
    const x: ixsAndSigners = {
      instructions: [1 as any, 2 as any],
      signers: [1 as any],
    }
    const y: ixsAndSigners = {
      instructions: [2 as any, 3 as any],
      signers: [2 as any, 3 as any],
    }
    const expected: ixsAndSigners = {
      instructions: [1 as any, 2 as any, 3 as any],
      signers: [1 as any, 2 as any, 3 as any],
    }
    const actual = mergeIxsAndSigners(x, y);
    expect(actual == expected);
  })
})