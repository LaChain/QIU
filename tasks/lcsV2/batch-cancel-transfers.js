const { task } = require("hardhat/config");

task("batch-cancel-transfers", "Cancels a batch of transfer requests")
  .addParam("contractAddress", "lcs contract address")
  .addVariadicPositionalParam("transferHashes", "Array of transfer hashes")
  .setAction(async (taskArgs, hre) => {
    let [sender] = await hre.ethers.getSigners();

    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    console.log("Batch cancel transfers...");
    const batchCancelTransfersTx = await lcs
      .connect(sender)
      .batchCancelTransfer(taskArgs.transferHashes);
    await batchCancelTransfersTx.wait(1);

    console.log(`Batch transfers canceled: ${taskArgs.transferHashes}`);
  });

module.exports = {};
