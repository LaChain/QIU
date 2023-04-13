const { task } = require("hardhat/config");
const EthCrypto = require("eth-crypto");

task("decrypt-cvu", "Decrypt cvu using privateKey")
  .addParam("encryptedCvu", "encrypted cvu to decrypt")
  .addParam("privateKey", "public key to encrypt cvu")
  .setAction(async (taskArgs, hre) => {
    const encryptCvu = EthCrypto.cipher.parse(taskArgs.encryptedCvu);

    const decrytedMessage = await EthCrypto.decryptWithPrivateKey(
      taskArgs.privateKey,
      encryptCvu
    );

    console.log(`Cvu: ${decrytedMessage} `);
  });

module.exports = {};
