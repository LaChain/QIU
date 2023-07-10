const { task } = require("hardhat/config");

task("transfer-info", "Get transfer info")
  .addParam("contractAddress", "qiu contract address")
  .addParam("transferHash", "hash of the transfer request")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    const transferInfo = await qiu.transfers(taskArgs.transferHash);
    const transferData = {
      originDomainHash: transferInfo.originDomainHash,
      destinationDomainHash: transferInfo.destinationDomainHash,
      amount: transferInfo.amount.toString(),
      encryptedOrigin: transferInfo.encryptedOrigin,
      encryptedDestination: transferInfo.encryptedDestination,
      nonce: transferInfo.nonce.toString(),
      expiration: transferInfo.expiration.toString(),
      status: transferInfo.status.toString(),
      externalRef: transferInfo.externalRef,
    };
    console.log(transferData);
    return transferData;
  });

module.exports = {};
