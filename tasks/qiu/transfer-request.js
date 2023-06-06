const { task } = require("hardhat/config");

task("transfer-request", "Initiate a transfer request")
  .addParam("contractAddress", "qiu contract address")
  .addParam("originDomain", "origin domain")
  .addParam("destinationDomain", "destination domain")
  .addParam("amount", "Amount of the transfer request")
  .addParam("encryptedOrigin", "encrypted origin")
  .addParam("encryptedDestination", "encrypted destination")
  .addParam("expiration", "expiration time of the transfer request")
  .addParam("externalRef", "external reference")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    // get transfer hash
    const transferHash = await hre.run("get-transfer-hash", {
      contractAddress: taskArgs.contractAddress,
      sender: sender.address,
      originDomain: taskArgs.originDomain,
      destinationDomain: taskArgs.destinationDomain,
      amount: taskArgs.amount,
      encryptedOrigin: taskArgs.encryptedOrigin,
      encryptedDestination: taskArgs.encryptedDestination,
      expiration: taskArgs.expiration,
    });

    console.log("Transfer request...");
    const transferRequestTx = await qiu
      .connect(sender)
      .transferRequest(
        taskArgs.originDomain,
        taskArgs.destinationDomain,
        taskArgs.amount,
        taskArgs.encryptedOrigin,
        taskArgs.encryptedDestination,
        taskArgs.expiration,
        taskArgs.externalRef
      );
    await transferRequestTx.wait(1);

    console.log(`Transfer request submitted!`);
    return { transferRequestTx, transferHash };
  });

module.exports = {};
