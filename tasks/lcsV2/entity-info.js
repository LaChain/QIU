const { task } = require("hardhat/config");

task("entity-info", "Get entity info")
  .addParam("contractAddress", "lcs contract address")
  .addParam("domainHash", "domain hash")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    const entityInfo = await lcs.domainHashToEntity(taskArgs.domainHash);
    console.log({
      domainHash: taskArgs.domainHash,
      entityAddress: entityInfo.entityAddress,
      entityId: entityInfo.entityId.toString(),
      nonce: entityInfo.nonce.toString(),
      domain: entityInfo.domain,
      publicKey: entityInfo.publicKey,
      disable: entityInfo.disable,
    });
    return entityInfo;
  });

module.exports = {};
