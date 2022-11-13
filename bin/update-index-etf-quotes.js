const pino = require("pino");
const InvestingScraper = require("investing.com-scraper");
require("dotenv").config();

require("../src/gateways/redis-gateway");
const supportedIndexes = require("../src/supported-indexes");
const AssetQuotesInteractor = require("../src/interactors/asset-quotes");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  prettyPrint: { colorize: true },
});

const getAssetKeyByTicker = (assetTicker) => {
  for (const key of Object.keys(supportedIndexes)) {
    const asset = supportedIndexes[key];
    if (asset["ticker"] === assetTicker) {
      return key;
    }
  }
  return undefined;
};

const updateAssetQuoteByAssetTicker = (assetTicker, quote) => {
  const result = `${quote["quote"]};${quote["change"]}`;
  const assetKey = getAssetKeyByTicker(assetTicker);
  logger.info(`Persisting ${assetKey} with ${result}`);
  try {
    AssetQuotesInteractor.updateAssetQuote(assetKey, result);
  } catch (e) {
    logger.errror(
      `Something went wrong while updating ${assetTicker} with ${quote}. Error: ${e}`
    );
  }
};

const start = async () => {
  const indexTickers = [];
  const etfTickers = [];
  for (const key of Object.keys(supportedIndexes)) {
    const asset = supportedIndexes[key];
    if (asset["type"] === "etf") {
      etfTickers.push(asset["ticker"]);
    } else {
      indexTickers.push(asset["ticker"]);
    }
  }
  const options = {
    debug: false,
    browserInstance: undefined,
  };

  // Start indexes
  InvestingScraper.multipleIndexQuote(
    indexTickers,
    updateAssetQuoteByAssetTicker,
    10000,
    options
  );

  // Start etfs
  InvestingScraper.multipleEtfQuote(
    etfTickers,
    updateAssetQuoteByAssetTicker,
    10000,
    options
  );
};

start();
