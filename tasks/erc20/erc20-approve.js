const { task } = require("hardhat/config");

task("erc20-approve", "Approve tokens for transfer")
  .addParam("erc20Address", "ERC20 contract address")
  .addParam("spender", "Spender/Recipient account")
  .addParam("amount", "Amount to mint")
  .setAction(async (taskArgs, hre) => {
    let [sender] = await hre.ethers.getSigners();

    const tERC20 = (await hre.ethers.getContractFactory("MockERC20")).attach(
      taskArgs.erc20Address
    );
    const amount = hre.ethers.utils.parseEther(taskArgs.amount);

    console.log("Approve...");
    const approveTx = await tERC20
      .connect(sender)
      .approve(taskArgs.spender, amount);
    await approveTx.wait(1);
    console.log(
      `Approve spender: ${taskArgs.spender} , amount: ${taskArgs.amount}`
    );
  });

module.exports = {};
