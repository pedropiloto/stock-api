const health = async (req, res, next) => {
  res.json({ status: "OK" });
};

module.exports = { health };
