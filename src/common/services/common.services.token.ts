import SolClient from "../client/common.client";
import {tryGetMintName} from "../util/common.util";

export default class TokenService extends SolClient {
  getMintName(mintPubkey: string): string | undefined {
    return tryGetMintName(mintPubkey)
  }
}