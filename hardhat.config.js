require("@nomicfoundation/hardhat-toolbox");
require("dotenv-defaults").config();
require("./tasks/erc20/erc20-tasks");
require("./tasks/lcsV2/lcsV2-tasks");
require("./tasks/utils/utils-tasks");

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const LACHAIN_TESTNET_RPC_URL = process.env.LACHAIN_TESTNET_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      gasPrice: 200000000000,
    },
    lachain: {
      url: LACHAIN_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 418,
      gasPrice: 10000000,
      gasMultiplier: 1.5,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  gasReporter: {
    enabled: true,
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
