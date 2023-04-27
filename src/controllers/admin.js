const asyncHandler = require("express-async-handler");

module.exports = {
  registerEntity: asyncHandler(async (req, res) => {
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

      console.log(tx);

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
};
