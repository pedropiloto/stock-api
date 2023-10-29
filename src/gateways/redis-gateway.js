const redis = require("redis");
const Bugsnag = require("@bugsnag/js");
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  prettyPrint: { colorize: true },
});

const client = redis.createClient({ url: process.env.REDIS_CONNECTION_STRING_URL })
  .on('error', error => {
    logger.error(`ERROR connecting to Redis: ${error}`);
    Bugsnag.notify(error);
  })
  .on("connect", () => {
    logger.info("Redis client connected");
  })

client.connect();

module.exports = client;
