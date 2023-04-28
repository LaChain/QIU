const { BadRequestError } = require("../errors/commonErrors");

const setConfig = (req, res, next) => {
  const network = req.headers["network"];
  const sender = req.headers["sender"];

  if (!network) {
    throw new BadRequestError("network header field is required");
  }
  if (!sender) {
    throw new BadRequestError("sender header field is required");
  }

  process.env.SELECTED_NETWORK = network;
  process.env.SELECTED_SENDER = sender;

  res.locals.networkId = network;
  res.locals.sender = sender;
  next();
};

module.exports = setConfig;
