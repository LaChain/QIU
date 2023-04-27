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
      originDomainHash: transferInfo.originDomainHash,
      destinationDomainHash: transferInfo.destinationDomainHash,
      amount: transferInfo.amount.toString(),
      encryptedOrigin: transferInfo.encryptedOrigin,
      encryptedDestination: transferInfo.encryptedDestination,
      nonce: transferInfo.nonce.toString(),
      expiration: transferInfo.expiration.toString(),
      status: transferInfo.status.toString(),
      externalRef: transferInfo.externalRef,
    });
    return transferInfo;
  });

module.exports = {};
