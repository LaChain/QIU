const express = require("express");
const api = express.Router();
const erc20Controller = require("../../controllers/erc20");

api.route("/allowance").post((req, res) => {
  res.send("OK");
});

// api.route("/approve").post(erc20Controller.approve);
// api.route("/balance").post(erc20Controller.balance);
// api.route("/mint").post(erc20Controller.mint);
// api.route("/transfer").post(erc20Controller.transfer);

module.exports = api;
