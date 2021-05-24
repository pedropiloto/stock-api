require('newrelic');
const getMetricEmitter = require('@newrelic/native-metrics')
const FinnhubGateway = require("./gateways/finnhub-gateway");
const Stock = require("./models/stock");
const SUPPORTED_CURRENCIES = require("./supported-currencies");
const mongoose = require("./config/database"); //database configuration
const Bugsnag = require('@bugsnag/js');
const { log } = require('./utils/logger');
const {
  OPERATIONAL_LOG_TYPE, BUSINESS_LOG_TYPE, ERROR_SEVERITY,
} = require('./utils/constants');

if (process.env.NODE_ENV === 'production' && process.env.BUSGNAG_API_KEY) {
  Bugsnag.start({
    apiKey: `${process.env.BUSGNAG_API_KEY}`
  });
}

const start = async () => {
  log({
    message: `starting configs-worker`, type: BUSINESS_LOG_TYPE, transactional: false
  });
  try {
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

    log({
      message: `start fetching stocks from api`, type: BUSINESS_LOG_TYPE, transactional: false
    });


    let stocks_response = (await FinnhubGateway.getStocks())
    let stocks=stocks_response.data.map((x)=>{return{symbol: x.symbol, currency: x.currency}})

    let upsertOptions = { upsert: true, new: true, setDefaultsOnInsert: true }

    //insert coins
    let insertStocksPromises = []
    stocks.forEach(element => {
      let query = { symbol: element.symbol }
      let update = { symbol: element.symbol, currency: element.currency, active: true }
      insertStocksPromises.push(Stock.findOneAndUpdate(query, update,
        upsertOptions).catch((error) => {
          log({
            message: `ERROR inserting stock: ${error.stack}, stock: ${element.symbol}`, type: BUSINESS_LOG_TYPE, transactional: false
          });
          Bugsnag.notify(error);
        }))
    });

    await Promise.all(insertStocksPromises)

    //update coins
    let updateStocksPromises = []
    let stocksData

    try {
      stocksData = await Stock.find({})
    } catch (error) {
      log({
        message: `ERROR fetching stocks from db: ${error.stack}`, type: BUSINESS_LOG_TYPE, transactional: false
      });
      Bugsnag.notify(error);
    }

    if (stocksData) {
      let stocksToDesactivate = stocksData.filter(sd => sd.added_manually !== true).filter(x => !stocks.find(y => y.symbol === x.symbol))
      stocksToDesactivate.forEach(element => {
        let query = { symbol: element.symbol }
        let update = { active: false }
        updateStocksPromises.push(Stock.findOneAndUpdate(query, update,
          {}).catch((error) => {
            log({
              message: `ERROR updating removed stock: ${error.stack}, stock: ${element}`, type: BUSINESS_LOG_TYPE, transactional: false
            });
            Bugsnag.notify(error);
          })
        )
      })

      log({
        message: `start updating stocks`, type: BUSINESS_LOG_TYPE, transactional: false
      });
      await Promise.all(updateStocksPromises)
      log({
        message: `finish updating stocks`, type: BUSINESS_LOG_TYPE, transactional: false
      });
    }
  } catch (error) {
    log({
      message: `UNKNOWN ERROR: ${error.stack}`, type: BUSINESS_LOG_TYPE, transactional: false
    });
    Bugsnag.notify(error);
    process.exit(1)
  }
}

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

start()
setInterval(() => {
  start()
}, process.env.CONFIG_INTERVAL || 86400 * 1000);
