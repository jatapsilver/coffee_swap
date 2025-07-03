// frontend/utils/ethers.ts
import { Contract, BrowserProvider, JsonRpcSigner } from "ethers";
import Web3Modal from "web3modal";
import TokenFarmABI from "../abis/TokenFarm.json";

export const TOKEN_FARM_ADDRESS = "0x5dADBe91cca895f25836748efF93fa4BffFeaf35";

export async function getProviderOrSigner(
  needsSigner = false
): Promise<BrowserProvider | JsonRpcSigner> {
  const web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions: {},
  });
  const externalProvider = await web3Modal.connect();

  const provider = new BrowserProvider(externalProvider);

  return needsSigner ? await provider.getSigner() : provider;
}

export function getTokenFarmContract(runner: BrowserProvider | JsonRpcSigner) {
  return new Contract(TOKEN_FARM_ADDRESS, TokenFarmABI.abi, runner);
}
