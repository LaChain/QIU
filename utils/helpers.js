// function to get signer in config file
const getSignerInConfig = async (address) => {
  // get signer from address parameter
  const signers = await hre.ethers.getSigners();

  // check if address is in signers array and return signer if true
  const signer = signers.find((signer) => signer.address === address);
  if (signer) {
    return signer;
  } else {
    return signers[0];
  }
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

// amount to wei
const toWei = (amount) => {
  return ethers.utils.parseUnits(amount, "ether");
};

module.exports = { getSignerInConfig, getTransferHash, toWei };
