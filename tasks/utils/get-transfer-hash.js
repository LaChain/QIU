const { task } = require("hardhat/config");

task("get-transfer-hash", "Get transfer hash")
  .addParam("contractAddress", "lcs contract address")
  .addParam("originDomain", "origin domain")
  .addParam("destinationDomain", "destination domain")
  .addParam("amount", "Amount of the transfer request")
  .addParam("encryptedOrigin", "encripted origin")
  .addParam("encryptedDestination", "encripted destination")
  .addParam("expiration", "expiration time of the transfer request")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    const originDomainHash = await lcs.getDomainHash(taskArgs.originDomain);
    const destinationDomainHash = await lcs.getDomainHash(
      taskArgs.destinationDomain
    );
    const entityOrigin = await lcs.domainHashToEntity(originDomainHash);
    const amount = hre.ethers.utils.parseEther(taskArgs.amount);

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
        amount,
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
