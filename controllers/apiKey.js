const database = require("../db/database");
const logger = require("../logger/logger");
const bcrypt = require("bcryptjs");
const rand = require("random-key");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(`${process.env.cryptrSecretKey}`);
const { ObjectId } = require("mongodb");
const md5 = require("md5");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const userCollection = database.GetCollection().userCollection();

const generateAPIKey = (req, res) => {
  const userEmail = req.user.userEmail;
  const scopes = req.body.scopes;
  const ipSources = req.body.ipSources;
  const expireDate = req.body.expireDate;
  const apiKey = rand.generate();
  const md5ApiKey = md5(apiKey);
  const clientId = rand.generateDigits(16);
  const md5ClientId = md5(clientId);
  const apiUserObject = {};
  apiUserObject.userEmail = userEmail;
  apiUserObject.scopes = scopes;
  apiUserObject.ipSources = ipSources;
  apiUserObject.expireDate = expireDate;
  apiUserObject.apiKey = md5ApiKey;
  apiUserObject.apiClientId = md5ClientId;

  userCollection.findOne({ userEmail: userEmail }, (error, result) => {
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
        apiKey: apiKey,
        secretKey: clientId,
        message: "Please store these keys secure.",
      });
    }
  });
};

module.exports = {
  generateAPIKey,
};
