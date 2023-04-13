const { task } = require("hardhat/config");

task("entity-info", "Get entity info")
  .addParam("contractAddress", "lcs contract address")
  .addParam("entityAddress", "Address of the entity")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    const entityInfo = await lcs.entities(taskArgs.entityAddress);
    console.log(entityInfo);
  });

module.exports = {};
