const asyncHandler = require("express-async-handler");
const { InternalServerError } = require("../errors/commonErrors");

module.exports = {
  nativeBalance: asyncHandler(async (req, res, next) => {
    try {
      // Get owner and spender from request parameters
      const address = req.params.address;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const balance = await run("native-balance", {
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
      throw new InternalServerError(error);
    }
  }),
  nativeTransfer: asyncHandler(async (req, res, next) => {
    try {
      // Get owner and spender from request parameters
      const body = req.body;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const tx = await run("native-transfer", {
        to: body.to,
        amount: body.amount,
      });

      // Respond with success
      res.status(200).json({
        txHash: tx.hash,
        to: body.to,
        amount: body.amount,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),
  encrypt: asyncHandler(async (req, res, next) => {
    try {
      const body = req.body;

      console.log(body.data);
      console.log(body.publicKey);

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const encriptedData = await run("encrypt", {
        data: body.data,
        publicKey: body.publicKey,
      });

      // Respond with success
      res.status(200).json({
        data: body.data,
        encriptedData: encriptedData,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),
};
