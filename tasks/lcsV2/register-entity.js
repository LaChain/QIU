const { task } = require("hardhat/config");
const { getSignerInConfig, setProvider } = require("../../utils/helpers");

task("register-entity", "Adds a new entity")
  .addParam("contractAddress", "lcs contract address")
  .addParam("domain", "entity domain")
  .addParam("entityAddress", "Address of the entity")
  .addParam("publicKey", "entity public key")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    console.log("Register a new entity...");
    const newEntityTx = await lcs
      .connect(sender)
      .registerEntity(
        taskArgs.domain,
        taskArgs.entityAddress,
        taskArgs.publicKey
      );
    await newEntityTx.wait(1);
    console.log("new Entity added: ", taskArgs.domain);
    return newEntityTx;
  });

module.exports = {};
