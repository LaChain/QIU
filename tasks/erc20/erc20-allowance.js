const { task } = require("hardhat/config");

task("erc20-allowance", "Allowance owner spender")
  .addParam("erc20Address", "ERC20 contract address")
  .addParam("owner", "owner Account")
  .addParam("spender", "spender account")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;
    const tERC20 = (await hre.ethers.getContractFactory("MockERC20")).attach(
      taskArgs.erc20Address
    );

    const allowance = await tERC20
      .connect(sender)
      .allowance(taskArgs.owner, taskArgs.spender);
    console.log(
      `Spender ${taskArgs.spender} is allowed to spend ${allowance} tokens on behalf of ${taskArgs.owner}`
    );
    return allowance.toString();
  });

module.exports = {};
