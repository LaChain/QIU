const { task } = require("hardhat/config");
const { toWei } = require("../../utils/helpers");

task("erc20-transfer", "Transfer tokens from one account to another")
  .addParam("erc20Address", "ERC20 contract address")
  .addParam("to", "to account")
  .addParam("amount", "Amount to transfer")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const tERC20 = (await hre.ethers.getContractFactory("MockERC20")).attach(
      taskArgs.erc20Address
    );
    // const amount = hre.ethers.utils.parseEther(taskArgs.amount);

    console.log("Transfer...");
    const transferTx = await tERC20
      .connect(sender)
      .transfer(taskArgs.to, toWei(taskArgs.amount));
    await transferTx.wait(1);
    console.log(
      `Transfer from: ${sender.address} , to: ${taskArgs.to} , amount: ${taskArgs.amount}`
    );
    return transferTx;
  });

module.exports = {};
