const database = require("../db/database");
const logger = require("../logger/logger");
const bcrypt = require("bcryptjs");
var rand = require("random-key");
const { ObjectId } = require("mongodb");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const userCollection = database.GetCollection().userCollection();

const generateAPIKey = async (req, res) => {
  const userId = req.user.id;
  const scopes = req.body.scopes;
  const ipSources = req.body.ipSources;
  const expireDate = req.body.expireDate;
  const salt = await bcrypt.genSalt(10);
  const apiSecretKey = await bcrypt.hash(rand.generate(), salt);
  const apiClientSecretKey = await bcrypt.hash(rand.generateDigits(16), salt);
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
        secretKey: apiSecretKey,
        apiClientSecretKey: apiClientSecretKey,
        message: "Please store these keys secure.",
      });
    }
  });
};

module.exports = {
  generateAPIKey,
};
