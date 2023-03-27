const hre = require("hardhat");
const EthCrypto = require("eth-crypto");

const exampleCVU = "0000003100036521571806";
const privateKey = "";

async function main() {
  const identity = EthCrypto.createIdentity();

  const encryptedCvu = await EthCrypto.encryptWithPublicKey(
    identity.publicKey,
    exampleCVU
  );

  const encryptedCvuStr = EthCrypto.cipher.stringify(encryptedCvu);

  const encryptCvu = EthCrypto.cipher.parse(encryptedCvuStr);

  const decrytedMessage = await EthCrypto.decryptWithPrivateKey(
    identity.privateKey,
    encryptCvu
  );

  console.log(identity);
  console.log(encryptedCvu);
  console.log(encryptedCvuStr);
  console.log(encryptCvu);
  console.log(decrytedMessage);

  const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
  console.log(publicKey);
  const eCvu = await EthCrypto.encryptWithPublicKey(publicKey, exampleCVU);
  const dm = await EthCrypto.decryptWithPrivateKey(privateKey, eCvu);
  console.log(dm);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
