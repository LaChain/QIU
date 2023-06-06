const { ApiError, InternalServerError } = require("../errors/commonErrors");

const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).send(err.serializeError());
  }
  logger.error(`${err.message}\n${err.stack}`);

  const unknownError = new InternalServerError();
  res.status(unknownError.statusCode).send(unknownError.serializeError());
};

module.exports = {
  errorHandler,
};
