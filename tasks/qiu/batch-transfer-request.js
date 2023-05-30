const { task } = require("hardhat/config");
const { getTransferHash } = require("../../utils/helpers");

task("batch-transfer-request", "Create a batch of transfer requests")
  .addParam("contractAddress", "qiu contract address")
  .addParam("originDomains", "origin domains")
  .addParam("destinationDomains", "destination domains")
  .addParam("amounts", "Amounts of the transfers requests")
  .addParam("encryptedOrigins", "encrypted origins")
  .addParam("encryptedDestinations", "encrypted destinations")
  .addParam("expirations", "expirations time of the transfer request")
  .addParam("externalRefs", "external references")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const originDomains = taskArgs.originDomains.split(",");
    const destinationDomains = taskArgs.destinationDomains.split(",");
    const amounts = taskArgs.amounts.split(",");
    const encryptedOrigins = taskArgs.encryptedOrigins.split(",");
    const encryptedDestinations = taskArgs.encryptedDestinations.split(",");
    const expirations = taskArgs.expirations.split(",");
    const externalRefs = taskArgs.externalRefs.split(",");
    if (
      originDomains.length !== destinationDomains.length ||
      originDomains.length !== amounts.length ||
      originDomains.length !== encryptedOrigins.length ||
      originDomains.length !== encryptedDestinations.length ||
      originDomains.length !== expirations.length ||
      originDomains.length !== externalRefs.length
    ) {
      throw new Error("All arrays must have the same length");
    }

    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    let transferHashes = [];

    for (let i = 0; i < originDomains.length; i++) {
      const originDomain = originDomains[i];
      const destinationDomain = destinationDomains[i];
      const tokenAmount = amounts[i];
      const encryptedOrigin = encryptedOrigins[i];
      const encryptedDestination = encryptedDestinations[i];
      const expirationTime = expirations[i];

      const originDomainHash = await qiu.getDomainHash(originDomain);
      const destinationDomainHash = await qiu.getDomainHash(destinationDomain);
      const entityInfo = await qiu.domainHashToEntity(originDomainHash);

      const transferHash = getTransferHash(
        sender.address,
        originDomainHash,
        destinationDomainHash,
        tokenAmount,
        encryptedOrigin,
        encryptedDestination,
        entityInfo.nonce.add(i),
        expirationTime
      );

      transferHashes.push(transferHash);
    }

    console.log("Batch Transfer request...");
    const batchtransferRequestTx = await qiu
      .connect(sender)
      .batchTransferRequest(
        originDomains,
        destinationDomains,
        amounts,
        encryptedOrigins,
        encryptedDestinations,
        expirations,
        externalRefs
      );
    await batchtransferRequestTx.wait(1);

    console.log(`Batch Transfer request submitted!`);
    return { batchtransferRequestTx, transferHashes };
  });

module.exports = {};
