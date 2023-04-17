const { task } = require("hardhat/config");

task("erc20-allowance", "Allowance owner spender")
  .addParam("erc20Address", "ERC20 contract address")
  .addParam("owner", "owner Account")
  .addParam("spender", "spender account")
  .setAction(async (taskArgs, hre) => {
    let [sender] = await hre.ethers.getSigners();

    const tERC20 = (await hre.ethers.getContractFactory("MockERC20")).attach(
      taskArgs.erc20Address
    );

    const allowance = await tERC20
      .connect(sender)
      .allowance(taskArgs.owner, taskArgs.spender);
    console.log(
      `Spender ${taskArgs.spender} is allowed to spend ${allowance} tokens on behalf of ${taskArgs.owner}`
    );
  });

module.exports = {};
