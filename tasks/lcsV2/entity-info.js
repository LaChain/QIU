const { task } = require("hardhat/config");

task("entity-info", "Get entity info")
  .addParam("contractAddress", "lcs contract address")
  .addParam("domain", "domain")
  .setAction(async (taskArgs, hre) => {
    const lcs = (
      await hre.ethers.getContractFactory("LocalCoinSettlementV2")
    ).attach(taskArgs.contractAddress);

    // get domain hash
    const domainHash = await lcs.getDomainHash(taskArgs.domain);

    const entityInfo = await lcs.domainHashToEntity(domainHash);
    const entityData = {
      domainHash: domainHash,
      entityAddress: entityInfo.entityAddress,
      nonce: entityInfo.nonce.toString(),
      domain: entityInfo.domain,
      publicKey: entityInfo.publicKey,
      disable: entityInfo.disable,
    };
    console.log(entityData);
    return entityData;
  });

module.exports = {};
