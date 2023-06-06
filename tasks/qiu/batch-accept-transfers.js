const { task } = require("hardhat/config");

task("batch-accept-transfers", "Accepts a batch of transfer requests")
  .addParam("contractAddress", "qiu contract address")
  .addVariadicPositionalParam("transferHashes", "Array of transfer hashes")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    console.log("Batch accept transfers...");
    const batchAcceptTransfersTx = await qiu
      .connect(sender)
      .batchAcceptTransfer(taskArgs.transferHashes);
    await batchAcceptTransfersTx.wait(1);

    console.log(`Batch transfers accepted: ${taskArgs.transferHashes}`);
    return batchAcceptTransfersTx;
  });

module.exports = {};
