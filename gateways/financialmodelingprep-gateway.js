require('dotenv').config();
const moment = require('moment');
const axios = require('axios');
const Bottleneck = require('bottleneck');

const financialmodelingprepToken = `${process.env.FINANCIAL_MODELING_PREP_TOKEN}`;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 5000, // pick a value that makes sense for your use case
});

const getSP500Quote = async (symbol) => {

  return limiter.wrap(() => axios({
    method: 'get',
    url: `https://financialmodelingprep.com/api/v3/quote/%5EGSPC?apikey=${financialmodelingprepToken}`
  }))();
};

module.exports = {
  getSP500Quote
};
