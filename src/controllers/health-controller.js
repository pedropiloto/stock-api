const client = require("../gateways/redis-gateway");
const health = async (_, res) => {
  try {
    const redisStatus = client.isReady ? "connected" : "disconnected";
    res.json({
      status: "OK",
      redis: redisStatus
    });
  } catch (error) {
    res.status(500).send("NOT OK: ERROR", error);
  }
};

module.exports = { health };
