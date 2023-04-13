const { task } = require("hardhat/config");

task("batch-accept-transfers", "Accepts a batch of transfer requests")
  .addParam("contractAddress", "lcs contract address")
  .addVariadicPositionalParam("transferHashes", "Array of transfer hashes")
  .setAction(async (taskArgs, hre) => {
    let [sender] = await hre.ethers.getSigners();

    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    console.log("Batch accept transfers...");
    const batchAcceptTransfersTx = await lcs
      .connect(sender)
      .batchAcceptTransfer(taskArgs.transferHashes);
    await batchAcceptTransfersTx.wait(1);

    console.log(`Batch transfers accepted: ${taskArgs.transferHashes}`);
  });

module.exports = {};
