import SolClient from "../client/common.client";
import {tryGetMintName} from "../util/common.util";

export default class TokenService extends SolClient {
  getMintName(mintPk: string): string | undefined {
    return tryGetMintName(mintPk)
  }
}