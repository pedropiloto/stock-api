const newrelic = require("newrelic");
const supportedIndexes = require("../config/supported-indexes");
const AssetQuotesInteractor = require("../interactors/asset-quotes");

// eslint-disable-next-line no-unused-vars
const getAssetQuote = async (req, res, next) => {
  setCustomNewRelicHeaders(req);
  const assetSymbol = req.query.name && req.query.name.toUpperCase();
  const quote = await AssetQuotesInteractor.call(assetSymbol);

  if (!quote) {
    res.status(500).send("Upstream Error");
    return;
  }
  newrelic.addCustomAttribute("cached", quote.isCached);
  res.send(quote.value);
  return;
};

// eslint-disable-next-line no-unused-vars
const getAsset = async (req, res, next) => {
  setCustomNewRelicHeaders(req);

  const assetSymbol = req.query.name && req.query.name.toUpperCase();

  //check if it is index / etf
  if (Object.keys(supportedIndexes).includes(assetSymbol)) {
    res.json({});
    return;
  }
  const quote = await AssetQuotesInteractor.call(assetSymbol);

  if (quote) {
    res.json({});
  } else {
    res.status(404).send("Stock does not exist");
  }
};

const setCustomNewRelicHeaders = (req) => {
  newrelic.addCustomAttribute(
    "device_mac_address",
    req.headers["device-mac-address"]
  );
  newrelic.addCustomAttribute(
    "device_model",
    req.headers["device-model"] || "MULTI_COIN"
  );
  newrelic.addCustomAttribute(
    "device_version",
    req.headers["device-version"] || "1.0.0"
  );
  newrelic.addCustomAttribute(
    "stock_symbol",
    req.query.name && req.query.name.toUpperCase()
  );
};

module.exports = { getAssetQuote, getAsset };
