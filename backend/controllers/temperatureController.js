const Temperature = require("../models/Temperature");

exports.getAllTemperatures = async (req, res) => {
  const temps =
    req.user.role === "admin"
      ? await Temperature.getAll()
      : await Temperature.getAllForUser(req.user.id);
  res.json(temps);
};
