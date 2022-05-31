
const newrelic = require('newrelic');
require("dotenv").config();
const Stock = require("../models/stock");
const { getQuote } = require("../gateways/finnhub-gateway");
const investingGateway = require("../gateways/investing");
const supportedIndexes = require("../supported-indexes");
/* Values are hard-coded for this example, it's usually best to bring these in via file or environment variable for production */
redisClient = require("../gateways/redis-gateway")
const { log } = require('../utils/logger');
const Bugsnag = require('@bugsnag/js');
const {
  OPERATIONAL_LOG_TYPE, ERROR_SEVERITY, BUSINESS_LOG_TYPE
} = require('../utils/constants');
const { connections } = require('mongoose');

const get = async (req, res, next) => {
  let device_mac_address = req.headers['device-mac-address']
  newrelic.addCustomAttribute('device_mac_address', req.headers['device-mac-address'])
  newrelic.addCustomAttribute('device_model', req.headers['device-model'] || "MULTI_COIN")
  newrelic.addCustomAttribute('device_version', req.headers['device-version'] || "1.0.0")
  let stock_symbol = req.query.name && req.query.name.toUpperCase()
  newrelic.addCustomAttribute('stock_symbol', stock_symbol)

  let cached_result = await redisClient.get(stock_symbol).catch((error) => {
    log({
      message: `ERROR fetching cache: ${error.stack}, stock: ${stock_symbol}, device_mac_address: ${device_mac_address}`,
      type: OPERATIONAL_LOG_TYPE,
      transactional: false,
      severity: ERROR_SEVERITY,
      stock_symbol,
      device_mac_address,
      error
    });
    Bugsnag.notify(error);
  })

  if (cached_result) {
    newrelic.addCustomAttribute('cached', true)
    log({
      message: `sent result: ${cached_result} from cache`, type: BUSINESS_LOG_TYPE, transactional: false, stock_symbol, device_mac_address
    });
    res.send(cached_result)
    return
  }

  newrelic.addCustomAttribute('cached', false)

  if (Object.keys(supportedIndexes).includes(stock_symbol)) {
    try {
      newrelic.addCustomAttribute('isIndex', true)
      result = await getIndex(stock_symbol, device_mac_address)
      res.send(result)
      return
    } catch (error) {
      log({
        message: `UNKNOWN ERROR: ${error.stack}, dtock: ${stock_symbol} device_mac_address: ${device_mac_address}`, type: OPERATIONAL_LOG_TYPE, transactional: false, stock_symbol, device_mac_address, severity: ERROR_SEVERITY, error
      });
      Bugsnag.notify(error);
      newrelic.noticeError(error)
      res.status(500).send("Upstream Error")
      return
    }
  }

  let stock_requested = await Stock.findOne({ symbol: stock_symbol })

  if (!stock_requested) {
    log({
      message: `Unsupported Stock`, type: BUSINESS_LOG_TYPE, transactional: false, stock_symbol, device_mac_address, severity: ERROR_SEVERITY
    });
    let error = new Error(`Unsupported Stock: ${stock_symbol}, device_mac_address:${device_mac_address}`)
    Bugsnag.notify(error);
    newrelic.noticeError(error)
    res.status(200).send("Unsupported")
    return
  }

  try {
    let provider_result = await getQuote(stock_symbol)
    let current_quote = provider_result.data.c
    let previous_close_quote = provider_result.data.pc
    let difference = Math.round(relDiff(current_quote, previous_close_quote) * 100) / 100

    let result = `${current_quote};${difference}`
    redisClient.set(stock_symbol, result).catch((error) => {
      log({
        message: `ERROR saving cache: ${error.stack}, stock: ${stock_symbol}, device_mac_address:${device_mac_address}`, type: BUSINESS_LOG_TYPE, transactional: false, stock_symbol, device_mac_address, severity: ERROR_SEVERITY
      });
      Bugsnag.notify(error);
    })
    let expireTTL = process.env.REDIS_TICKER_MARKET_TTL || 5
    log({
      message: `Setting Ticker ${stock_symbol}, device_mac_address: ${device_mac_address} to expire in ${expireTTL}`, type: BUSINESS_LOG_TYPE, transactional: false, stock_symbol, device_mac_address
    });
    redisClient.expire(stock_symbol, expireTTL)
    log({
      message: `sent result: ${result} from api`, type: BUSINESS_LOG_TYPE, transactional: false, stock_symbol, device_mac_address
    });
    res.send(result)
  } catch (error) {
    log({
      message: `UNKNOWN ERROR: ${error.stack}, dtock: ${stock_symbol} device_mac_address: ${device_mac_address}`, type: OPERATIONAL_LOG_TYPE, transactional: false, stock_symbol, device_mac_address, severity: ERROR_SEVERITY, error
    });
    Bugsnag.notify(error);
    newrelic.noticeError(error)
    res.status(500).send("Upstream Error")
    return
  }
}

const getIndex = async (index) => {

  const stock_symbol = supportedIndexes[index]
  const provider_result = await investingGateway.getIndexQuote(stock_symbol)

  const result = `${provider_result['quote']};${provider_result['change']}`
  redisClient.set(index, result).catch((error) => {
    Bugsnag.notify(error);
  })
  let expireTTL = process.env.REDIS_INDEX_TICKER_MARKET_TTL || 3600
  redisClient.expire(index, expireTTL)
  return result

}

const update = async (req, res, next) => {
  for (const supportedIndex of Object.keys(supportedIndexes)) {
    getIndex(supportedIndex)
  }
  res.json({})
  return
}




const getStock = async (req, res, next) => {
  try {
    let stock_requested = req.query.name && req.query.name.toUpperCase()
    newrelic.addCustomAttribute('device_mac_address', req.headers['device-mac-address'])
    newrelic.addCustomAttribute('device_model', req.headers['device-model'] || "MULTI_STOCK")
    newrelic.addCustomAttribute('device_version', req.headers['device-version'] || "1.0.0")
    newrelic.addCustomAttribute('stock', stock_requested)

    let stock = await Stock.findOne({ symbol: stock_requested, active: true })

    if (!!stock) {
      res.json(stock)
    } else {
      res.status(404).send("Stock does not exist")
    }

  } catch (error) {
    log({
      message: `UNKNOWN ERROR: ${error.stack}, stock: ${stock_requested} device_mac_address: ${device_mac_address}`, type: OPERATIONAL_LOG_TYPE, transactional: false, stock_symbol: stock_requested, device_mac_address, severity: ERROR_SEVERITY, error
    });
    Bugsnag.notify(error);
    newrelic.noticeError(error)
    res.status(500).send("Upstream Error")
  }
}

function relDiff(a, b) {
  return 100 * (a - b) / ((a + b) / 2);
}

module.exports = { get, getStock, update };
