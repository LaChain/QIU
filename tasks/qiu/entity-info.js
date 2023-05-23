const { task } = require("hardhat/config");

task("entity-info", "Get entity info")
  .addParam("contractAddress", "qiu contract address")
  .addParam("domain", "domain")
  .setAction(async (taskArgs, hre) => {
    const qiu = (await hre.ethers.getContractFactory("Qiu")).attach(
      taskArgs.contractAddress
    );

    // get domain hash
    const domainHash = await qiu.getDomainHash(taskArgs.domain);

    const entityInfo = await qiu.domainHashToEntity(domainHash);
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
