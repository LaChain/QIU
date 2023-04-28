const { task } = require("hardhat/config");
const EthCrypto = require("eth-crypto");

task("encrypt", "Encrypt using publickey")
  .addParam("data", "data to encrypt")
  .addParam("publicKey", "public key to encrypt data")
  .setAction(async (taskArgs, hre) => {
    console.log("data: ", taskArgs.data);
    console.log("publicKey: ", taskArgs.publicKey);

    const eData = await EthCrypto.encryptWithPublicKey(
      taskArgs.publicKey,
      taskArgs.data
    );
    const encryptedStr = EthCrypto.cipher.stringify(eData);

    console.log(encryptedStr);

    console.log(`Data: ${taskArgs.data} , encryptedData: ${encryptedStr}`);
    return encryptedStr;
  });

module.exports = {};
