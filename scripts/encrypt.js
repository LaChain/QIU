const hre = require("hardhat");
const EthCrypto = require("eth-crypto");

const exampleData = "0000003100036521571806";
const privateKey = "";

async function main() {
  const identity = EthCrypto.createIdentity();

  const encryptedData = await EthCrypto.encryptWithPublicKey(
    identity.publicKey,
    exampleData
  );

  const encryptedDataStr = EthCrypto.cipher.stringify(encryptedData);

  const encryptData = EthCrypto.cipher.parse(encryptedDataStr);

  const decrytedMessage = await EthCrypto.decryptWithPrivateKey(
    identity.privateKey,
    encryptData
  );

  console.log(identity);
  console.log(encryptedData);
  console.log(encryptedDataStr);
  console.log(encryptData);
  console.log(decrytedMessage);

  const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
  console.log(publicKey);
  const eData = await EthCrypto.encryptWithPublicKey(publicKey, exampleData);
  const dm = await EthCrypto.decryptWithPrivateKey(privateKey, eData);
  console.log(dm);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
