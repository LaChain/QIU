const { task } = require("hardhat/config");

task("native-balance", "Balance native currency of address")
  .addParam("address", "address Account")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const balance = await hre.ethers.provider.getBalance(taskArgs.address);

    console.log(`Native Balance: ${balance} of address: ${taskArgs.address}`);
    return balance.toString();
  });

module.exports = {};
