const asyncHandler = require("express-async-handler");
const { InternalServerError } = require("../errors/commonErrors");

module.exports = {
  registerEntity: asyncHandler(async (req, res, next) => {
    try {
      const body = req.body;
      const contractAddress = req.headers["qiu-address"];

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const tx = await run("register-entity", {
        contractAddress: contractAddress,
        domain: body.domain,
        entityAddress: body.entityAddress,
        publicKey: body.publicKey,
      });

      // Respond with success
      res.status(200).json({
        txHash: tx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),

  batchCreateTransferRequest: asyncHandler(async (req, res) => {
    try {
      const body = req.body;
      const contractAddress = req.headers["qiu-address"];

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const { batchtransferRequestTx, transferHashes } = await run(
        "batch-transfer-request",
        {
          contractAddress: contractAddress,
          originDomains: body.originDomains,
          destinationDomains: body.destinationDomains,
          amounts: body.amounts,
          encryptedOrigins: body.encryptedOrigins,
          encryptedDestinations: body.encryptedDestinations,
          expirations: body.expirations,
          externalRefs: body.externalRefs,
        }
      );

      // Respond with success
      res.status(200).json({
        txHash: batchtransferRequestTx.hash,
        transferHashes: transferHashes,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),

  createTransferRequest: asyncHandler(async (req, res) => {
    try {
      const body = req.body;
      const contractAddress = req.headers["qiu-address"];

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const { transferRequestTx, transferHash } = await run(
        "transfer-request",
        {
          contractAddress: contractAddress,
          originDomain: body.originDomain,
          destinationDomain: body.destinationDomain,
          amount: body.amount,
          encryptedOrigin: body.encryptedOrigin,
          encryptedDestination: body.encryptedDestination,
          expiration: body.expiration,
          externalRef: body.externalRef,
        }
      );

      // Respond with success
      res.status(200).json({
        txHash: transferRequestTx.hash,
        transferHash: transferHash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),
  batchAcceptTransfers: asyncHandler(async (req, res) => {
    try {
      const body = req.body;
      const contractAddress = req.headers["qiu-address"];

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const transferRequestTx = await run("batch-accept-transfers", {
        contractAddress: contractAddress,
        transferHashes: body.transferHashes,
      });

      // Respond with success
      res.status(200).json({
        txHash: transferRequestTx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),
  batchCancelTransfers: asyncHandler(async (req, res) => {
    try {
      const body = req.body;
      const contractAddress = req.headers["qiu-address"];

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const transferRequestTx = await run("batch-cancel-transfers", {
        contractAddress: contractAddress,
        transferHashes: body.transferHashes,
      });

      // Respond with success
      res.status(200).json({
        txHash: transferRequestTx.hash,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),

  // get all entities
  getAllEntities: asyncHandler(async (req, res) => {
    try {
      const contractAddress = req.headers["qiu-address"];

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const entities = await run("get-all-entities", {
        contractAddress: contractAddress,
      });

      // Respond with success
      res.status(200).json({
        entities: entities,
      });
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),

  // get all entities
  entityInfo: asyncHandler(async (req, res) => {
    try {
      const contractAddress = req.headers["qiu-address"];

      const domain = req.params.domain;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const entityInfo = await run("entity-info", {
        contractAddress: contractAddress,
        domain: domain,
      });

      // Respond with success
      res.status(200).json(entityInfo);
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),
  transferInfo: asyncHandler(async (req, res) => {
    try {
      const contractAddress = req.headers["qiu-address"];

      const transferHash = req.params.transferHash;

      // Execute the Hardhat task
      const { run } = require("hardhat");
      const transferInfo = await run("transfer-info", {
        contractAddress: contractAddress,
        transferHash: transferHash,
      });

      // Respond with success
      res.status(200).json(transferInfo);
    } catch (error) {
      // Handle task execution errors
      console.error(error);
      throw new InternalServerError(error);
    }
  }),
};
