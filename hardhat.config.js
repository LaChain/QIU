require("@nomicfoundation/hardhat-toolbox");
require("dotenv-defaults").config();
require("./tasks/erc20/erc20-tasks");
require("./tasks/qiu/qiu-tasks");
require("./tasks/utils/utils-tasks");
const { main: setup } = require("./setup");
const { extendEnvironment } = require("hardhat/config");

extendEnvironment((hre) => {
  // You can access the setup function from your tasks or tests using hre.setup
  hre.setup = setup;
});

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const LACHAIN_TESTNET_RPC_URL = process.env.LACHAIN_TESTNET_RPC_URL;
const PRIVATE_KEYS = process.env.PRIVATE_KEYS;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const LACHAIN_EXPLORER_URL = process.env.LACHAIN_EXPLORER_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "lachain",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEYS.split(","),
      chainId: 5,
      gasPrice: 200000000000,
    },
    lachain: {
      url: LACHAIN_TESTNET_RPC_URL,
      accounts: PRIVATE_KEYS.split(","),
      chainId: 418,
      gasPrice: 10000000,
      gasMultiplier: 1.5,
    },
  },
  etherscan: {
    apiKey: {
      //ethereum
      goerli: ETHERSCAN_KEY,
      lachain: ETHERSCAN_KEY,
    },
    customChains: [
      {
        network: "lachain",
        chainId: 418,
        urls: {
          apiURL: LACHAIN_EXPLORER_URL + "/api",
          browserURL: LACHAIN_EXPLORER_URL,
        },
      },
    ],
  },
  gasReporter: {
    enabled: false,
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};
