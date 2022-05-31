const InvestingScraper = require("investing.com-scraper");
const puppeteer = require('puppeteer-extra');

const getIndexQuote = async (symbol) => {
 let browser

 if (process.env.CUSTOM_CHROMIUM_EXECUTABLE_PATH) {
  browser = await puppeteer.launch({
   headless: true,
   executablePath: process.env.CUSTOM_CHROMIUM_EXECUTABLE_PATH,
   args: [
    '--no-sandbox',
    '--disable-gpu',
   ]
  });
 } else {
  browser = await puppeteer.launch({
   headless: true,
   args: ["--no-sandbox", "--disabled-setupid-sandbox"]
  });
 }


 return InvestingScraper.indexQuote(symbol, { browserInstance: browser })
}

module.exports = { getIndexQuote }