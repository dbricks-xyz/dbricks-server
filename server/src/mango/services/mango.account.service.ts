import { fetchMangoAccounts, getMangoClient, getMangoGroup } from "../logic/mango.account.logic";
import SolClient from '../../common/logic/client';
import { PublicKey } from "@solana/web3.js";

class MangoAccountService {
  async getMangoAccounts(publicKey: string): Promise<Object[]> {
    // TODO: should probably be [String, PKey] -> want to display name on ui, but use PKey
    const mangoClient = await getMangoClient(SolClient.connection);
    const mangoGroup = await getMangoGroup(mangoClient);
    if (!mangoGroup) { // TODO: Stop doing these checks
      return [];
    }
    const mangoAccounts = await fetchMangoAccounts(mangoClient, mangoGroup, new PublicKey(publicKey));
    if (!mangoAccounts) {
      return [];
    }
    return mangoAccounts.map((acc) => ({ name: acc.name, publicKey: acc.publicKey }));
  }
}

export default new MangoAccountService();
