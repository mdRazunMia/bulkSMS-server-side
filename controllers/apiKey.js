const database = require("../db/database");
const logger = require("../logger/logger");
const bcrypt = require("bcryptjs");
var rand = require("random-key");
const { ObjectId } = require("mongodb");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const userCollection = database.GetCollection().userCollection();
const generateAPIKey = (req, res) => {
  const userId = req.query.id;
  const scopes = req.body.scopes;
  const ipSources = req.body.ipSources;
  const expireDate = req.body.expireDate;
  const apiSecretKey = rand.generate();
  const apiUserObject = {};
  apiUserObject.userId = userId;
  apiUserObject.scopes = scopes;
  apiUserObject.ipSources = ipSources;
  apiUserObject.expireDate = expireDate;
  apiUserObject.apiSecretKey = apiSecretKey;

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
      res.status(200).send({ secretKey: apiSecretKey });
    }
  });
};
module.exports = {
  generateAPIKey,
};
