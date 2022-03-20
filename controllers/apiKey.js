const database = require("../db/database");
const logger = require("../logger/logger");
const bcrypt = require("bcryptjs");
const rand = require("random-key");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(`${process.env.cryptrSecretKey}`);
const { ObjectId } = require("mongodb");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const userCollection = database.GetCollection().userCollection();

const generateAPIKey = (req, res) => {
  const userId = req.user.id;
  const scopes = req.body.scopes;
  const ipSources = req.body.ipSources;
  const expireDate = req.body.expireDate;
  // const salt = await bcrypt.genSalt(10);
  const apiKey = rand.generate();
  const apiSecretKey = cryptr.encrypt(apiKey);
  const clientKey = rand.generateDigits(16);
  const apiClientSecretKey = cryptr.encrypt(clientKey);
  const apiUserObject = {};
  apiUserObject.userId = userId;
  apiUserObject.scopes = scopes;
  apiUserObject.ipSources = ipSources;
  apiUserObject.expireDate = expireDate;
  apiUserObject.apiSecretKey = apiSecretKey;
  apiUserObject.apiClientSecretKey = apiClientSecretKey;

  userCollection.findOne({ _id: ObjectId(userId) }, (error, result) => {
    if (error) {
      return res.status(500).send("Internal error");
    }
    if (result === null) {
      return res.status(404).send({ errorMessage: "User is not found" });
    } else {
      apiKeyCollection.insertOne(apiUserObject, (error, res) => {
        if (error)
          return res
            .status(500)
            .send({ errorMessage: "Internal server error." });
      });
      res.status(200).send({
        secretKey: apiKey,
        apiClientSecretKey: clientKey,
        message: "Please store these keys secure.",
      });
    }
  });
};

module.exports = {
  generateAPIKey,
};
