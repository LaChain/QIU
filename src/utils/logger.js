const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "portal-accounts" },
  format: winston.format.combine(
    winston.format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = {
  logger,
};
