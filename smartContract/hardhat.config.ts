import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const NODO_API_KEY = process.env.NODO_API_KEY;
const ETHER_SCAN_API_KEY = process.env.ETHER_SCAN_API_KEY;
const WALLET_OWNER = process.env.WALLET_OWNER;

if (!NODO_API_KEY) {
  throw new Error(
    "Define la variable NODO_API_KEY en el archivo .env para poder continuar"
  );
}

if (!ETHER_SCAN_API_KEY) {
  throw new Error(
    "Define la variable ETHER_SCAN_API_KEY en el archivo .env para poder continuar"
  );
}

if (!WALLET_OWNER) {
  throw new Error(
    "Define la variable WALLET_OWNER en el archivo .env para poder continuar"
  );
}

const config: HardhatUserConfig = {
  solidity: "0.8.30",

  networks: {
    sepolia: {
      url: NODO_API_KEY,
      accounts: [ETHER_SCAN_API_KEY],
    },
  },

  etherscan: {
    apiKey: {
      sepolia: WALLET_OWNER, //esta es la apikey de la billetera owner
    },
  },
  gasReporter: {
    currency: "USD",

    enabled: true,

    excludeContracts: [],
  },
};

export default config;
