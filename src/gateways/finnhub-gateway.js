const axios = require("axios");
const Bottleneck = require("bottleneck");

const finnhubToken = `${process.env.FINNHUB_TOKEN}`;
const headers = {};
headers["X-Finnhub-Token"] = finnhubToken;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 5000, // pick a value that makes sense for your use case
});

const getStocks = async () => {
  return limiter.wrap(() =>
    axios({
      method: "get",
      url: "https://finnhub.io/api/v1/stock/symbol?exchange=US",
      headers,
    })
  )();
};

const getQuote = async (symbol) => {
  return limiter.wrap(() =>
    axios({
      method: "get",
      url: `https://finnhub.io/api/v1/quote?symbol=${symbol}`,
      headers,
    })
  )();
};

module.exports = {
  getStocks,
  getQuote,
};
