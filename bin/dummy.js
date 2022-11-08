const investingGateway = require("../gateways/investing");

const start = async () => {
 const response = await investingGateway.getIndexQuote('us-spx-500')
 console.log(response)
}

start()
