const { task } = require("hardhat/config");

task("erc20-balance", "Balance Erc20 of address")
  .addParam("erc20Address", "ERC20 contract address")
  .addParam("address", "address Account")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const tERC20 = (await hre.ethers.getContractFactory("MockERC20")).attach(
      taskArgs.erc20Address
    );

    const balance = await tERC20.connect(sender).balanceOf(taskArgs.address);
    console.log(`Balance: ${balance} of address: ${taskArgs.address}`);
    return balance.toString();
  });

module.exports = {};
