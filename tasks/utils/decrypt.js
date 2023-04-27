const { task } = require("hardhat/config");
const EthCrypto = require("eth-crypto");

task("decrypt", "Decrypt using privateKey")
  .addParam("encryptedData", "encrypted data to decrypt")
  .addParam("privateKey", "private key to use")
  .setAction(async (taskArgs, hre) => {
    const encryptCvu = EthCrypto.cipher.parse(taskArgs.encryptedData);

    const decrytedMessage = await EthCrypto.decryptWithPrivateKey(
      taskArgs.privateKey,
      encryptCvu
    );

    console.log(`Cvu: ${decrytedMessage} `);
  });

module.exports = {};
