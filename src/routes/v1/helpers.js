const express = require("express");
const api = express.Router();
const helperController = require("../../controllers/helpers");
const setConfig = require("../../middlewares/setConfig");

api.route("/encrypt").post(setConfig, helperController.encrypt);
api
  .route("/native-balance/:address")
  .get(setConfig, helperController.nativeBalance);
api.route("/native-transfer").post(setConfig, helperController.nativeTransfer);

module.exports = api;
