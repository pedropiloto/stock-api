const Ape = require("../models/ape");

// eslint-disable-next-line no-unused-vars
const get = async (req, res, next) => {
  const apes = await Ape.find({});

  let str = "";

  for (const element of apes) {
    str = str + element.ip_address + "\n";
  }

  res.status(200).contentType("text/plain").send(str);
};

// eslint-disable-next-line no-unused-vars
const create = async (req, res, next) => {
  const discord_id = req.body.discord_id;
  const ip_address = req.body.ip_address;

  if (!isValidIP(ip_address)) {
    return res.send(400, {
      status: "error",
      message: "Invalid IP Address",
    });
  }

  const filter = { discord_id };
  const update = { discord_id, ip_address };

  Ape.findOneAndUpdate(
    filter,
    update,
    {
      upsert: true,
      new: true,
    },
    function (err, result) {
      if (err) return res.send(500, { error: err });
      return res.json({
        status: "success",
        message:
          "You are in 🐒 \n Segue os seguintes passos para usares o node na nami : \n 1- Abre a nami \n 2- Vai a Settings \n 3- Vai a Network \n4- Ativa a opção custom node \n 5- Insere o seguinte link: `http://adanode.smartevolve.com:8091/api/submit/tx`",
        data: result,
      });
    }
  );
};

// eslint-disable-next-line no-unused-vars
const custom = async (req, res, next) => {
  return res.json({});
};

const isValidIP = (str) => {
  const octet = "(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)";
  const regex = new RegExp(`^${octet}\\.${octet}\\.${octet}\\.${octet}$`);
  return regex.test(str);
};

module.exports = { get, create, custom };
