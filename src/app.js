// const {env} = require('./config');
const dotenv = require("dotenv");
const path = require("path");
// Set the path to your .env file
const envPath = path.resolve(__dirname, "../.env");
// Load environment variables from the specified path
dotenv.config({ path: envPath });

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParserErrorHandler = require("express-body-parser-error-handler");
const { BadRequestError } = require("./errors/commonErrors");

const { default: axios } = require("axios");
require("express-async-errors");

const app = express();

// Settings
axios.defaults.timeout = 10000; // milliseconds;

// App Setup
app.use(morgan("combined"));
app.use(express.json({ type: "*/*" }));
app.use(
  bodyParserErrorHandler({
    onError: (err) => {
      throw new BadRequestError(err.message);
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("OK");
});

const erc20Routes = [require("./routes/v1/erc20")];
app.use("/v1/erc20/", erc20Routes);

const lcsRoutes = [require("./routes/v1/lcs")];
app.use("/v1/lcs/", lcsRoutes);

const routes = [require("./routes/v1/helpers")];
app.use("/v1/", routes);

module.exports = app;
