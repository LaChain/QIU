const { task } = require("hardhat/config");
const EthCrypto = require("eth-crypto");

task("encrypt-cvu", "Encrypt cvu using publickey")
  .addParam("cvu", "cvu to encrypt")
  .addParam("publicKey", "public key to encrypt cvu")
  .setAction(async (taskArgs, hre) => {
    const encryptedCvu = await EthCrypto.encryptWithPublicKey(
      taskArgs.publicKey,
      taskArgs.cvu
    );
    const encryptedCvuStr = EthCrypto.cipher.stringify(encryptedCvu);

    console.log(`Cvu: ${taskArgs.cvu} , encryptedCvu: ${encryptedCvuStr}`);
  });

module.exports = {};
