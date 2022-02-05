
const newrelic = require('newrelic');
require("dotenv").config();
const Ape = require("../models/ape");
const { connections } = require('mongoose');

const get = async (req, res, next) => {

  apes = await Ape.find({})

  let str = ""

  for (const element of apes) {
    str = str + element.ip_address + "\n"
  }

  res
    .status(200)
    .contentType('text/plain')
    .send(str);
}

const create = async (req, res, next) => {

  const discord_id = req.body.discord_id
  const ip_address = req.body.ip_address

  if (!isValidIP(ip_address)) {
    return res.send(400,
      {
        status: "error",
        message: 'Invalid IP Address'
      }
    );
  }

  const filter = { discord_id };
  const update = { discord_id, ip_address };

  Ape.findOneAndUpdate(filter, update, {
    upsert: true, new: true
  }, function (err, result) {
    if (err) return res.send(500, { error: err });
    return res.json({
      status: "success",
      message: "You are in 🐒 \n Segue os seguintes passos para usares o node na nami : \n 1- Abre a nami \n 2- Vai a Settings \n 3- Vai a Network \n4- Ativa a opção custom node \n 5- Insere o seguinte link: `http://adanode.smartevolve.com:8091/api/submit/tx`",
      data: result
    });
  });
}


const cenas = async (req, res, next) => {
  return res.json(
    {
      "id": "61fef942a47fe8448e7c47db",
      "transaction": "84a600818258208e486b745efd39fc7e9b52ddc7aca15654ca3ba3bb8e596bbd1a2306b3cdb39d01018482583901b7ecb676a1826b060ca7fe03135cbb0caf03c02bbb36f2ee9392f822e528e3fafc180cbd8931e9a564a9d29ab7f25f7836e9360f12d9669c821a00150bd0a1581cf4873b426a498350c579690bd1f4a369d5d7b521c778acf322f77334a14a4452415045303733313701825839012024caf9b7755b7b51b7ea422d7acaa48a27dd534bfe9f94d691a1f84ec9449bf5a6afc1839dc310633f63c259ea78820b9e12c3e40931291a01e8480082583901b7ecb676a1826b060ca7fe03135cbb0caf03c02bbb36f2ee9392f822e528e3fafc180cbd8931e9a564a9d29ab7f25f7836e9360f12d9669c821a002fe146a4581c0e4a1ac3f1158a5ba61d7c1704eb0e04dec8cd834383d0115bc5789aa855436172646153746174696f6e4c616e6450394e34360156436172646153746174696f6e4c616e644e33395034360156436172646153746174696f6e4c616e644e35385034390156436172646153746174696f6e4c616e644e36325031350156436172646153746174696f6e4c616e645033385032330156436172646153746174696f6e4c616e645033394e31340156436172646153746174696f6e4c616e645036324e32340156436172646153746174696f6e4c616e6450363350313401581c7107f5ac94b138f06b1e3b5e7a0d8e5f1aeea2af131d06081c6a1ffba14d5a6f6d6269654f776c7338383901581cc0e6c802993aadbe53fccf26811d21965854109dc8d8ece113cca940a14d436c617942756666793330333701581cccb3577601d6cf0e021288871112926338bee685c6c37eeadf6dddd9a15343617264616e6961466f756e646572426c75650182583901b7ecb676a1826b060ca7fe03135cbb0caf03c02bbb36f2ee9392f822e528e3fafc180cbd8931e9a564a9d29ab7f25f7836e9360f12d9669c1a29c253b1021a00035071031a04d36cf7075820781ab35187a47c4f42520b68e3a33fbaf4fb5bd4e41b5f25576978b0c8327d1409a1581cf4873b426a498350c579690bd1f4a369d5d7b521c778acf322f77334a14a4452415045303733313701a0f5f6",
      "expiresAt": "2022-02-05T22:27:06.498Z"
     }
  );
}

const isValidIP = (str) => {
  const octet = '(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)';
  const regex = new RegExp(`^${octet}\\.${octet}\\.${octet}\\.${octet}$`);
  return regex.test(str);
}

module.exports = { get, create, cenas };
