const database = require("../db/database");
const logger = require("../logger/logger");
const bcrypt = require("bcryptjs");
const rand = require("random-key");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const moment = require("moment");

const userCollection = database.GetCollection().userCollection();

const jwtApiKeyGeneration = (req, res) => {
  const userEmail = req.user.userEmail;
  const scopes = req.body.scopes;
  const ipSources = req.body.ipSources;
  const exDate = req.body.expireDate;
  const apiKey = rand.generate();
  const clientId = rand.generateDigits(16);

  userCollection.findOne({ userEmail: userEmail }, (error, result) => {
    if (error) {
      return res.status(500).send("Internal error");
    }
    if (result === null) {
      return res.status(404).send({ errorMessage: "User is not found" });
    } else {
      const expireDate = moment(exDate).format("YYYY-MM-DD");
      const currentDate = moment(new Date()).format("YYYY-MM-DD");
      const remainingDays = moment(expireDate).diff(currentDate, "days");
      const expireIn = remainingDays + "d";
      const token = jwt.sign(
        {
          userEmail: userEmail,
          scopes: scopes,
          ipSources: ipSources,
          expireDate: expireDate,
          apiKey: apiKey,
          apiClientId: clientId,
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: expireIn,
        }
      );
      res.status(200).send({
        apiKey: token,
        message: "Please store these keys secure.",
      });
    }
  });
};

module.exports = {
  jwtApiKeyGeneration,
};
