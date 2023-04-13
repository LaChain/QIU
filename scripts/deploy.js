// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

function bn(x) {
  return hre.ethers.BigNumber.from(x);
}

async function main() {
  [owner] = await hre.ethers.getSigners();

  const initialBalance = bn("100000000").mul("1000000000000000000");

  console.log("Deploying ERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const tERC20 = await MockERC20.deploy(
    "Num Ars",
    "NARS",
    owner.address,
    initialBalance
  );
  await tERC20.deployed();
  console.log(`ERC20 deployed to ${tERC20.address}`);

  console.log("Deploying LocalCoinSettlement...");
  const LocalCoinSettlementV2 = await hre.ethers.getContractFactory(
    "LocalCoinSettlement"
  );
  const localCoinSettlementV2 = await LocalCoinSettlementV2.connect(
    owner
  ).deploy(tERC20.address);
  await localCoinSettlementV2.deployed();
  console.log(
    `LocalCoinSettlement deployed to ${localCoinSettlementV2.address}`
  );

  if (hre.network.config.chainId === 5 && hre.config.etherscan.apiKey.goerli) {
    console.log("Waiting for block confirmations...");
    await tERC20.deployTransaction.wait(6);
    await verify(tERC20.address, [taskArgs.name, taskArgs.symbol]);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat verify 0xA5D8D2bD0c251aac9bAbefD65d2D315B5F93E43c "Ripio Coin" "RPC" 0x768A675e33Bf0ac6cFCe8f555DF77D6Ad4d79787 100000000000000000000000000 --network ropsten
// npx hardat verify 0xAc005c7BD5e75914d01Afa1Af4cD42c2EE10D903
