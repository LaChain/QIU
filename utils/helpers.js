// function to get signer in config file
const getSignerInConfig = async (address) => {
  const signers = await ethers.getSigners();

  // check if address is in signers array and return signer if true
  const signer = signers.find((signer) => signer.address === address);
  if (signer) {
    return signer;
  } else {
    return signers[0];
  }
};

const setProvider = async (selectedNetwork) => {
  // If selectedNetwork is not defined or empty, use the default network from the Hardhat configuration
  if (!selectedNetwork || !hre.config.networks[selectedNetwork]) {
    selectedNetwork = hre.config.defaultNetwork;
  }

  if (!hre.config.networks[selectedNetwork]) {
    console.error(
      `Error: Network ${selectedNetwork} not found in Hardhat configuration.`
    );
    process.exit(1);
  }

  try {
    // Set the default network in the Hardhat Runtime Environment
    hre.network.name = selectedNetwork;
    hre.network.config = hre.config.networks[selectedNetwork];

    console.log(`Network provider has been set to: ${selectedNetwork}`);
  } catch (error) {
    console.error(
      `Error setting network provider to ${selectedNetwork}:`,
      error
    );
    process.exit(1);
  }
};

module.exports = { getSignerInConfig, setProvider };
