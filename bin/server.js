require("newrelic");
const express = require("express");
const morganLogger = require("morgan");
const cors = require("cors");
const pino = require("pino");
const Bugsnag = require("@bugsnag/js");
var BugsnagPluginExpress = require("@bugsnag/plugin-express");
require("dotenv").config();

const mongoose = require("../src/config/database"); //database configuration
const stockController = require("../src/controllers/stockController");
const healthController = require("../src/controllers/healthController");
const apeController = require("../src/controllers/apeController");
const authMiddleware = require("../src/auth-middleware");
const noAuthMiddleware = require("../src/no-auth-middleware");

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
app.get("/stock/quote", authMiddleware, stockController.getAssetQuote);
app.get("/stock", authMiddleware, stockController.getAsset);
app.get("/health", authMiddleware, healthController.health);
app.get("/ape", authMiddleware, apeController.get);
app.post("/ape", authMiddleware, apeController.create);
app.post("/custom", noAuthMiddleware, apeController.custom);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Node server listening on port ${port}`);
});

mongoose.connection.on("error", () => {
  logger.error("MongoDB connection error");
  Bugsnag.notify(new Error("MongoDB connection error"));
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
