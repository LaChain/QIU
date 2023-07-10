const { task } = require("hardhat/config");

task("get-all-entities", "Get all entities info")
  .addParam("contractAddress", "qiu contract address")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    const entities = await qiu.getAllEntities();
    return entities;
  });

module.exports = {};
