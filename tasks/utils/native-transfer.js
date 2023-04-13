const { task } = require("hardhat/config");

task("native-transfer", "Send native currency to an address")
  .addParam("to", "The address of the receiver account")
  .addParam("amount", "The amount of native currency to send")
  .setAction(async (taskArgs, hre) => {
    let [sender] = await hre.ethers.getSigners();
    const to = taskArgs.to;
    const amount = hre.ethers.utils.parseEther(taskArgs.amount);

    const tx = await sender.sendTransaction({
      to: to,
      value: amount,
    });

    console.log(
      `Sent ${taskArgs.amount} native tokens from ${sender.address} to ${to}`
    );
    console.log(`Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log("Transaction confirmed");
  });

module.exports = {};
