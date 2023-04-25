const { task } = require("hardhat/config");

task("get-transfer-hash", "Get transfer hash")
  .addParam("contractAddress", "lcs contract address")
  .addParam("sender", "Address of the sender entity")
  .addParam("destination", "Address of the destination entity")
  .addParam("amount", "Amount of the transfer request")
  .addParam("encryptedOrigin", "encripted origin")
  .addParam("encryptedDestination", "encripted destination")
  .addParam("expiration", "expiration time of the transfer request")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    const amount = hre.ethers.utils.parseEther(taskArgs.amount);

    const senderInfo = await lcs.entities(taskArgs.sender);
    const transferHash = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "bytes", "bytes", "uint224", "uint256"],
      [
        taskArgs.sender,
        taskArgs.destination,
        amount,
        taskArgs.encryptedOrigin,
        taskArgs.encryptedDestination,
        senderInfo.nonce,
        taskArgs.expiration,
      ]
    );
    console.log("Transfer hash: ", transferHash);
    return transferHash;
  });

module.exports = {};
