const { task } = require("hardhat/config");

task("get-transfer-hash", "Get transfer hash")
  .addParam("contractAddress", "qiu contract address")
  .addParam("originDomain", "origin domain")
  .addParam("destinationDomain", "destination domain")
  .addParam("amount", "Amount of the transfer request")
  .addParam("encryptedOrigin", "encripted origin")
  .addParam("encryptedDestination", "encripted destination")
  .addParam("expiration", "expiration time of the transfer request")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    const originDomainHash = await qiu.getDomainHash(taskArgs.originDomain);
    const destinationDomainHash = await qiu.getDomainHash(
      taskArgs.destinationDomain
    );
    const entityOrigin = await qiu.domainHashToEntity(originDomainHash);
    // const amount = hre.ethers.utils.parseEther(taskArgs.amount);

    const transferHash = ethers.utils.solidityKeccak256(
      [
        "address",
        "bytes32",
        "bytes32",
        "uint256",
        "bytes",
        "bytes",
        "uint256",
        "uint256",
      ],
      [
        entityOrigin.entityAddress,
        originDomainHash,
        destinationDomainHash,
        taskArgs.amount,
        taskArgs.encryptedOrigin,
        taskArgs.encryptedDestination,
        entityOrigin.nonce,
        taskArgs.expiration,
      ]
    );

    console.log("Transfer hash: ", transferHash);
    return transferHash;
  });

module.exports = {};
