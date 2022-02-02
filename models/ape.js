const mongoose = require("mongoose");

//Define a schema
const Schema = mongoose.Schema;

const ApeSchema = new Schema({
  ip_address: {
    type: String,
    trim: true,
    required: true,
    index: true,
  }

},
{timestamps:true});

module.exports = mongoose.model("Ape", ApeSchema);
