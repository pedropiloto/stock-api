const newrelic = require("newrelic");
const Bugsnag = require("@bugsnag/js");
const redisClient = require("../gateways/redis-gateway");

const supportedIndexes = require("../config/supported-indexes");
const FinnhubGateway = require("../gateways/finnhub-gateway");
const { getLogger } = require("../utils/logger");

const logger = getLogger();

const call = async (assetSymbol) => {
  let cachedResult = await redisClient.get(assetSymbol).catch((error) => {
    logger.error(`ERROR fetching cache: ${error.stack}, stock: ${assetSymbol}`);
    Bugsnag.notify(error);
  });

  if (cachedResult) {
    return { value: cachedResult, isCached: true };
  }

  if (Object.keys(supportedIndexes).includes(assetSymbol)) {
    logger.error(`No index value in cache ${assetSymbol}`);
    return undefined;
  }

  try {
    let providerResult = await FinnhubGateway.getQuote(assetSymbol);
    let currentQuote = providerResult.data.c;
    let previousCloseQuote = providerResult.data.pc;
    let difference =
      Math.round(relDiff(currentQuote, previousCloseQuote) * 100) / 100;
    if (currentQuote === 0 && previousCloseQuote === 0) {
      logger.error(`Ticker ${assetSymbol} did not return a valid quote`);
      return undefined;
    }
    let result = `${currentQuote};${difference}`;
    redisClient.set(assetSymbol, result).catch((error) => {
      logger.error(`ERROR saving cache: ${error.stack}, stock: ${assetSymbol}`);
      Bugsnag.notify(error);
    });
    let expireTTL = process.env.REDIS_TICKER_MARKET_TTL || 5;
    logger.info(`Setting Ticker ${assetSymbol} to expire in ${expireTTL}`);
    redisClient.expire(assetSymbol, expireTTL);
    return { value: result, isCached: false };
  } catch (error) {
    logger.error(`UNKNOWN ERROR: ${error.stack}, stock: ${assetSymbol}`);
    Bugsnag.notify(error);
    newrelic.noticeError(error);
    return undefined;
  }
};

const updateAssetQuote = (assetSymbol, quote) => {
  redisClient.set(assetSymbol, quote).catch((error) => {
    Bugsnag.notify(error);
  });
};

const relDiff = (a, b) => {
  return (100 * (a - b)) / ((a + b) / 2);
};

module.exports = { call, updateAssetQuote };
