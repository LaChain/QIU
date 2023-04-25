const EthCrypto = require("eth-crypto");

const encrypt = async (publicKey, data) => {
  const encryptedData = await EthCrypto.encryptWithPublicKey(publicKey, data);
  const encryptedDataStr = EthCrypto.cipher.stringify(encryptedData);
  return encryptedDataStr;
};
const decrypt = async (privateKey, eData) => {
  const encryptData = EthCrypto.cipher.parse(eData.substring(2));
  const decrytedMessage = await EthCrypto.decryptWithPrivateKey(
    privateKey,
    encryptData
  );
  return decrytedMessage;
};

const createIdentity = () => {
  const identity = EthCrypto.createIdentity();
  return identity;
};

module.exports = { encrypt, decrypt, createIdentity };
