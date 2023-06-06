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

const getTransferHash = (
  entityOriginAddress,
  originDomainHash,
  destinationDomainHash,
  tokenAmount,
  encryptedOrigin,
  encryptedDestination,
  nonce,
  expirationTime
) => {
  const transferHash = ethers.utils.solidityKeccak256(
    [
      "address",
      "bytes32",
      "bytes32",
      "uint256",
      "bytes",
      "bytes",
      "uint256",
      "uint256",
    ],
    [
      entityOriginAddress,
      originDomainHash,
      destinationDomainHash,
      tokenAmount,
      encryptedOrigin,
      encryptedDestination,
      nonce,
      expirationTime,
    ]
  );
  return transferHash;
};

module.exports = { encrypt, decrypt, createIdentity, getTransferHash };
