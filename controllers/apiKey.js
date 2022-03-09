const database = require("../db/database");
const logger = require("../logger/logger");
const bcrypt = require("bcryptjs");
const {
  apiKeyGenerationUserSignUPValidation,
  apiKeyGenerationUserLogInValidation,
} = require("../validations/validation");
var rand = require("random-key");
const { ObjectId } = require("mongodb");
const apiKeyCollection = database.GetCollection().apiKeyCollection();

const apiKeyGenerationSignUP = async (req, res) => {
  const { error, value } = apiKeyGenerationUserSignUPValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | Code: 1-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  }
  const userEmail = value.userEmail;
  const salt = await bcrypt.genSalt(10);
  const userPassword = await bcrypt.hash(value.userPassword1, salt);
  const secretKey = "";
  const apiKeyObject = {
    userEmail: userEmail,
    userPassword: userPassword,
    userSecretKey: secretKey,
  };
  //   console.log(apiKeyObject);
  apiKeyCollection.findOne({ userEmail: userEmail }, async (err, result) => {
    if (err) {
      logger.log({
        level: "error",
        message: "Internal error when user login the system. | Code: 2-2",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    if (result !== null) {
      res
        .status(400)
        .send({ errorMessage: "This email is already registered." });
    } else {
      apiKeyCollection.insertOne(apiKeyObject, (error, res) => {
        if (error) {
          logger.log({
            level: "error",
            message: "Internal error when user login the system. | Code: 2-2",
          });
          return res.status(500).send({ errorMessage: "Something went wrong" });
        }
      });
      res
        .status(200)
        .send({ userRegisterSuccessMessage: "User successfully registered" });
    }
  });
};

const apiKeyGenerationLogIn = async (req, res) => {
  const { error, value } = apiKeyGenerationUserLogInValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | Code: 1-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  }
  userEmail = value.userEmail;
  userPassword = value.userPassword;
  apiKeyCollection.findOne({ userEmail: userEmail }, async (error, result) => {
    if (error) {
      logger.log({
        level: "error",
        message: "Internal error when user login the system. | Code: 2-2",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    if (result === null) {
      return res.status(404).send({
        errorMessage: "User is not registered. Please register first.",
      });
    } else {
      const validPassword = await bcrypt.compare(
        userPassword,
        result.userPassword
      );
      if (validPassword) {
        res
          .status(200)
          .send({ message: "User successfully logged in.", id: result._id });
      } else {
        logger.log({
          level: "error",
          message: "User password error | Code: 2-5",
        });
        return res.status(401).send({ errorMessage: "Password is incorrect." });
      }
    }
  });
};

const generateAPIKey = (req, res) => {
  const userId = req.query.id;
  apiKeyCollection.findOne({ _id: ObjectId(userId) }, (error, result) => {
    if (error) {
      logger.log({
        level: "error",
        message: "Internal error when user login the system. | Code: 2-2",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    if (result !== null) {
      const secretKey = rand.generate();
      const userInformation = { _id: ObjectId(userId) };
      const updatedUserInformation = {
        $set: { userSecretKey: secretKey },
      };
      apiKeyCollection.updateOne(
        userInformation,
        updatedUserInformation,
        function (err, object) {
          if (err) {
            logger.log({
              level: "error",
              message:
                "Internal error in user update password function. | | code: 5-2",
            });
            return res
              .status(500)
              .send({ errorMessage: "Something went wrong" });
          }
          logger.log({
            level: "info",
            message: "API secret key successfully created. | | code: 5-4",
          });
          res.status(200).send({
            updateSuccessMessage:
              "API secret key has been created successfully.",
          });
        }
      );
    }
  });
};

const showAPIKey = (req, res) => {
  const userId = req.query.id;
  apiKeyCollection.findOne({ _id: ObjectId(userId) }, (error, result) => {
    if (error) {
      logger.log({
        level: "error",
        message: "Internal error when user login the system. | Code: 2-2",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    if (result === null) {
      return res
        .status(401)
        .send({
          errorMessage: "User is not authorized to show the secret Key.",
        });
    } else {
      return res.status(200).send({ secretKey: result.userSecretKey });
    }
  });
};
module.exports = {
  apiKeyGenerationSignUP,
  apiKeyGenerationLogIn,
  generateAPIKey,
  showAPIKey,
};
