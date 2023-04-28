const express = require("express");
const api = express.Router();
const adminController = require("../../controllers/admin");
const setConfig = require("../../middlewares/setConfig");

api.route("/register-entity").post(setConfig, adminController.registerEntity);

module.exports = api;
