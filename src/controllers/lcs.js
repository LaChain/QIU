const asyncHandler = require("express-async-handler");

module.exports = {
  registerEntity: asyncHandler(async (req, res, next) => {
    try {
      const body = req.body;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const tx = await run("register-entity", {
        contractAddress: body.contractAddress,
        domain: body.domain,
        entityAddress: body.entityAddress,
        publicKey: body.publicKey,
      });

      // Respond with success
      res.status(200).json({
        success: true,
        txHash: tx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),

  createTransferRequest: asyncHandler(async (req, res) => {
    try {
      const body = req.body;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const transferRequestTx = await run("transfer-request", {
        contractAddress: body.contractAddress,
        originDomain: body.originDomain,
        destinationDomain: body.destinationDomain,
        amount: body.amount,
        encryptedOrigin: body.encryptedOrigin,
        encryptedDestination: body.encryptedDestination,
        expiration: body.expiration,
        externalRef: body.externalRef,
      });

      // Respond with success
      res.status(200).json({
        success: true,
        txHash: transferRequestTx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      res.sendStatus(500);
    }
  }),
};
