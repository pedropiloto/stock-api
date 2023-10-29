const pino = require("pino");

const investingGateway = require("../gateways/investing");

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const start = async () => {
  const response = await investingGateway.getIndexQuote("us-spx-500");
  logger.info(response);
};
start();
