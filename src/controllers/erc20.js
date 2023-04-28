const asyncHandler = require("express-async-handler");

module.exports = {
  allowance: asyncHandler(async (req, res, next) => {
    try {
      const contractAddress = req.headers["erc20-address"];

      // Get owner and spender from request parameters
      const owner = req.params.owner;
      const spender = req.params.spender;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const allowance = await run("erc20-allowance", {
        erc20Address: contractAddress,
        owner: owner,
        spender: spender,
      });

      // Respond with success
      res.status(200).json({
        owner: owner,
        spender: spender,
        allowance: allowance,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),
  balance: asyncHandler(async (req, res, next) => {
    try {
      const contractAddress = req.headers["erc20-address"];

      // Get owner and spender from request parameters
      const address = req.params.address;

      console.log(contractAddress);
      console.log(address);

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const balance = await run("erc20-balance", {
        erc20Address: contractAddress,
        address: address,
      });

      // Respond with success
      res.status(200).json({
        address: address,
        balance: balance,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),
  approve: asyncHandler(async (req, res, next) => {
    try {
      const contractAddress = req.headers["erc20-address"];
      const body = req.body;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const tx = await run("erc20-approve", {
        erc20Address: contractAddress,
        spender: body.spender,
        amount: body.amount,
      });

      // Respond with success
      res.status(200).json({
        txHash: tx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),
  mint: asyncHandler(async (req, res, next) => {
    try {
      const contractAddress = req.headers["erc20-address"];
      const body = req.body;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const tx = await run("erc20-mint", {
        erc20Address: contractAddress,
        account: body.account,
        amount: body.amount,
      });

      // Respond with success
      res.status(200).json({
        txHash: tx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),
  transfer: asyncHandler(async (req, res, next) => {
    try {
      const contractAddress = req.headers["erc20-address"];
      const body = req.body;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const tx = await run("erc20-transfer", {
        erc20Address: contractAddress,
        to: body.to,
        amount: body.amount,
      });

      // Respond with success
      res.status(200).json({
        txHash: tx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),
};
