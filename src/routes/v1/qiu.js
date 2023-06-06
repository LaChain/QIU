const express = require("express");
const api = express.Router();
const qiuController = require("../../controllers/qiu");
const setConfig = require("../../middlewares/setConfig");

api.route("/register-entity").post(setConfig, qiuController.registerEntity);
api
  .route("/batch-transfer-request")
  .post(setConfig, qiuController.batchCreateTransferRequest);
api
  .route("/transfer-request")
  .post(setConfig, qiuController.createTransferRequest);
api
  .route("/batch-accept-transfers")
  .post(setConfig, qiuController.batchAcceptTransfers);

api
  .route("/batch-cancel-transfers")
  .post(setConfig, qiuController.batchCancelTransfers);

api.route("/entities").get(setConfig, qiuController.getAllEntities);
api.route("/entity-info/:domain").get(setConfig, qiuController.entityInfo);
api
  .route("/transfer-info/:transferHash")
  .get(setConfig, qiuController.transferInfo);

module.exports = api;
