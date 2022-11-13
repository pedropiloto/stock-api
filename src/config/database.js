//Set up mongoose connection
const mongoose = require("mongoose");
const mongoDB = process.env.MONGO_URL;
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;

module.exports = mongoose;
