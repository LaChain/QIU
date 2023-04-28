const { task } = require("hardhat/config");

task("get-all-entities", "Get all entities info")
  .addParam("contractAddress", "lcs contract address")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    const entities = await lcs.getAllEntities();
    return entities;
  });

module.exports = {};
