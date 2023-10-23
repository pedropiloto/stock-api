const pino = require("pino");

const investingGateway = require("../gateways/investing");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  prettyPrint: { colorize: true },
});


const start = async () => {
  const response = await investingGateway.getIndexQuote("us-spx-500");
  logger.info(response);
};

const start2 = async () => {
  const response = await investingGateway.getIndexQuote("us-spx-500");
  logger.info(response);
};

start();
