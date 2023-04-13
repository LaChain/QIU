const { task } = require("hardhat/config");
const EthCrypto = require("eth-crypto");

task("create-new-entity-keys", "Create new entity keys").setAction(async () => {
  const identity = EthCrypto.createIdentity();

  console.log(identity);
});

module.exports = {};
