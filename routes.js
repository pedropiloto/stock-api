const express = require("express");
const router = express.Router();
const tickerController = require("./controllers/tickerController");

router.get("/", tickerController.get);

module.exports = router;
