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

const getAssetKeysByTicker = (assetTicker) => {
  const assetKeys = []
  for (const assetKey of Object.keys(supportedIndexes)) {
    const asset = supportedIndexes[assetKey];
    if (asset["ticker"] === assetTicker) {
      assetKeys.push(assetKey);
    }
  }
  return assetKeys;
};

const updateAssetQuoteByAssetTicker = (assetTicker, quote) => {
  const result = `${quote["quote"]};${quote["change"]}`;
  const assetKeys = getAssetKeysByTicker(assetTicker);
  for (const assetKey of assetKeys) {
    logger.info(`Persisting ${assetKey} with ${result}`);
    try {
      AssetQuotesInteractor.updateAssetQuote(assetKey, result);
    } catch (e) {
      logger.errror(
        `Something went wrong while updating ${assetTicker} with ${quote}. Error: ${e}`
      );
    }
  }
};

const start = async () => {
  let indexTickers = [];
  let etfTickers = [];
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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
    
  };

  const delay = 60000

  indexTickers = [...new Set(indexTickers)];
  etfTickers = [...new Set(etfTickers)];

  console.log(indexTickers)
  console.log(etfTickers)

  // Start indexes
  InvestingScraper.multipleIndexQuote(
    indexTickers,
    updateAssetQuoteByAssetTicker,
    delay,
    options
  );

  // Start etfs
  InvestingScraper.multipleEtfQuote(
    etfTickers,
    updateAssetQuoteByAssetTicker,
    delay,
    options
  );
};

start();
