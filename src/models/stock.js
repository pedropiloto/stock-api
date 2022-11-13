const mongoose = require("mongoose");

//Define a schema
const Schema = mongoose.Schema;

const StockSchema = new Schema(
  {
    symbol: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    currency: {
      type: String,
      trim: true,
      required: true,
    },
    active: {
      type: Boolean,
      trim: true,
      required: true,
      default: true,
    },
    added_manually: {
      type: Boolean,
      trim: true,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);
