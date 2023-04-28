const express = require("express");
const api = express.Router();
const erc20Controller = require("../../controllers/erc20");
const setConfig = require("../../middlewares/setConfig");

api
  .route("/allowance/:owner/:spender")
  .get(setConfig, erc20Controller.allowance);
api.route("/balance/:address").get(setConfig, erc20Controller.balance);

api.route("/approve").post(setConfig, erc20Controller.approve);
api.route("/mint").post(setConfig, erc20Controller.mint);
api.route("/transfer").post(setConfig, erc20Controller.transfer);

module.exports = api;
