const express = require("express");
const api = express.Router();
const adminController = require("../../controllers/admin");

api.route("/register-entity").post(adminController.registerEntity);

module.exports = api;
