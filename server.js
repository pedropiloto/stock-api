require('newrelic');
const express = require("express");
const logger = require("morgan");
const stockController = require("./controllers/stockController");
const apeController = require("./controllers/apeController");
const authMiddleware = require("./auth-middleware")
const noAuthMiddleware = require("./no-auth-middleware")
const app = express();
const mongoose = require("./config/database"); //database configuration
const getMetricEmitter = require('@newrelic/native-metrics')
const { log } = require('./utils/logger');
const {
  OPERATIONAL_LOG_TYPE, ERROR_SEVERITY,
} = require('./utils/constants');
const Bugsnag = require('@bugsnag/js');
var BugsnagPluginExpress = require('@bugsnag/plugin-express')
const cors = require('cors');

mongoose.connection.on(
  "error",
  () => {
    log({
      message: 'MongoDB connection error',
      type: OPERATIONAL_LOG_TYPE,
      transactional: false,
      severity: ERROR_SEVERITY,
    });
    Bugsnag.notify(new Error('MongoDB connection error'));
  }
);

if (process.env.NODE_ENV === 'production' && process.env.BUSGNAG_API_KEY) {
  Bugsnag.start({
    apiKey: `${process.env.BUSGNAG_API_KEY}`,
    plugins: [BugsnagPluginExpress]
  });
  const bugsnagMiddleware = Bugsnag.getPlugin('express')
  app.use(bugsnagMiddleware.requestHandler)
  app.use(bugsnagMiddleware.errorHandler)
}

app.use(cors({
  origin: '*'
}));

app.use(logger("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// private route

app.get("/stock/quote", authMiddleware, stockController.get);
app.get("/stock", authMiddleware, stockController.getStock);
app.post("/stock/actions/update", authMiddleware, stockController.update);

app.get("/ape", authMiddleware, apeController.get);
app.post("/ape", authMiddleware, apeController.create);

app.post("/cenas", noAuthMiddleware, apeController.cenas);

const port = process.env.PORT || 3000;

app.listen(port, function () {
  log({
    message: `Node server listening on port ${port}`,
    type: OPERATIONAL_LOG_TYPE,
    transactional: false,
  });
});

var emitter = getMetricEmitter()
if (emitter.gcEnabled) {
  setInterval(() => {
    emitter.getGCMetrics()
  }, 1000)
}

if (emitter.loopEnabled) {
  setInterval(() => {
    emitter.getLoopMetrics()
  }, 1000)
}
