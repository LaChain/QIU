const express = require("express");
const api = express.Router();
const entityController = require("../../controllers/entity");

api
  .route("/create-transfer-request")
  .post(adminController.createTransferRequest);

module.exports = api;
