require("newrelic");
const express = require("express");
const morganLogger = require("morgan");
const cors = require("cors");
const Bugsnag = require("@bugsnag/js");
var BugsnagPluginExpress = require("@bugsnag/plugin-express");
require("dotenv").config();

require("../src/gateways/redis-gateway");
const StockController = require("../src/controllers/stock-controller");
const HealthController = require("../src/controllers/health-controller");
const authMiddleware = require("../src/middlewares/auth-middleware");
const noAuthMiddleware = require("../src/middlewares/no-auth-middleware");
const { getLogger } = require("../src/utils/logger");
const logResponseTime = require("../src/middlewares/response-time-logger-middleware");
const logError = require("../src/middlewares/error-logger-middleware");
const responseTime = require("response-time");

const logger = getLogger();

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(morganLogger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseTime(logResponseTime));

// routes
app.get("/stock/quote", authMiddleware, StockController.getAssetQuote);
app.get("/stock", authMiddleware, StockController.getAsset);
app.get("/health", noAuthMiddleware, HealthController.health);

app.use(logError);

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
