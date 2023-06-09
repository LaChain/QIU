const { task } = require("hardhat/config");
const { toWei } = require("../../utils/helpers");

task("erc20-mint", "Mint tokens on an ERC20 mintable contract")
  .addParam("erc20Address", "ERC20 contract address")
  .addParam("account", "Account to mint")
  .addParam("amount", "Amount to mint")
  .setAction(async (taskArgs, hre) => {
    await hre.setup();
    const sender = hre.network.config.sender;

    const tERC20 = (await hre.ethers.getContractFactory("MockERC20")).attach(
      taskArgs.erc20Address
    );

    console.log("Mint...");
    const mintTx = await tERC20
      .connect(sender)
      .mint(taskArgs.account, toWei(taskArgs.amount));
    await mintTx.wait(1);
    console.log(
      `Mint account: ${taskArgs.account} , amount: ${taskArgs.amount}`
    );
    return mintTx;
  });

module.exports = {};
