const express = require("express");
const api = express.Router();
const lcsController = require("../../controllers/lcs");
const setConfig = require("../../middlewares/setConfig");

api.route("/register-entity").post(setConfig, lcsController.registerEntity);
api
  .route("/transfer-request")
  .post(setConfig, lcsController.createTransferRequest);
api
  .route("/batch-accept-transfers")
  .post(setConfig, lcsController.batchAcceptTransfers);

api
  .route("/batch-cancel-transfers")
  .post(setConfig, lcsController.batchCancelTransfers);

api.route("/entities").get(setConfig, lcsController.getAllEntities);
api.route("/entity-info/:domain").get(setConfig, lcsController.entityInfo);
api
  .route("/transfer-info/:transferHash")
  .get(setConfig, lcsController.transferInfo);

module.exports = api;
