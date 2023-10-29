require("newrelic");
const express = require("express");
const morganLogger = require("morgan");
const cors = require("cors");
const pino = require("pino");
const Bugsnag = require("@bugsnag/js");
var BugsnagPluginExpress = require("@bugsnag/plugin-express");
require("dotenv").config();

require("../src/gateways/redis-gateway");
const StockController = require("../src/controllers/stock-controller");
const HealthController = require("../src/controllers/health-controller");
const authMiddleware = require("../src/auth-middleware");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  prettyPrint: { colorize: true },
});

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(morganLogger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/stock/quote", authMiddleware, StockController.getAssetQuote);
app.get("/stock", authMiddleware, StockController.getAsset);
app.get("/health", authMiddleware, HealthController.health);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Node server listening on port ${port}`);
});

if (process.env.NODE_ENV === "production" && process.env.BUSGNAG_API_KEY) {
  Bugsnag.start({
    apiKey: `${process.env.BUSGNAG_API_KEY}`,
    plugins: [BugsnagPluginExpress],
  });
  const bugsnagMiddleware = Bugsnag.getPlugin("express");
  app.use(bugsnagMiddleware.requestHandler);
  app.use(bugsnagMiddleware.errorHandler);
}
