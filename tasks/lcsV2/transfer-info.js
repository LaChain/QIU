const { task } = require("hardhat/config");

task("transfer-info", "Get transfer info")
  .addParam("contractAddress", "lcs contract address")
  .addParam("transferHash", "hash of the transfer request")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    const transferInfo = await lcs.transfers(taskArgs.transferHash);
    console.log({
      origin: transferInfo.origin,
      destination: transferInfo.destination,
      amount: transferInfo.amount.toString(),
      encryptedOrigin: transferInfo.encryptedOrigin,
      encryptedDestination: transferInfo.encryptedDestination,
      expiration: transferInfo.expiration.toString(),
      status: transferInfo.status.toString(),
    });
    return transferInfo;
  });

module.exports = {};
