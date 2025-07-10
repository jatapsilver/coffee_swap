import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

const DappTokenFarmModule = buildModule("DappTokenFarmModule", (m) => {
  const deployer = m.getAccount(0);

  const dappToken = m.contract("DAppToken", [deployer]);
  const lpToken = m.contract("LPToken", [deployer]);

  const tokenFarm = m.contract("TokenFarm", [dappToken, lpToken]);

  m.call(dappToken, "transferOwnership", [tokenFarm]);

  m.call(lpToken, "mint", [deployer, ethers.parseEther("1000")]);

  return {
    dappToken,
    lpToken,
    tokenFarm,
  };
});

export default DappTokenFarmModule;
