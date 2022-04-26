const express = require("express");
const router = express.Router();
const passport = require("passport");
const database = require("../db/database");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const redisInstance = require("../db/redis");
const userCollection = database.GetCollection().userCollection();
const logger = require("../logger/logger");

router.get(
  "/linkedin",
  passport.authenticate("linkedin", {
    scope: ["r_emailaddress", "r_liteprofile"],
  })
);

router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/auth/linkedInError" }),
  function (req, res) {
    const redisClient = redisInstance.getRedisClient();
    const userFullName = req.user.displayName;
    const linkedInUserEmail = req.user.emails[0];
    const userEmail = linkedInUserEmail.value;
    const linkedInUser = {
      userFullName: userFullName,
      userEmail: userEmail,
      verified: true,
      medium: "linkedIn",
    };
    userCollection.findOne({ userEmail: userEmail }, (err, result) => {
      if (err) {
        logger.log({
          level: "error",
          message:
            "Internal error for user login by using linkedin. | code: 14-1",
        });
        return res.status(500).send({ errorMessage: "Something went wrong" });
      }
      if (result == null) {
        const authToken = jwt.sign(
          { userEmail: result.userEmail },
          process.env.TOKEN_SECRET,
          { expiresIn: process.env.JWT_EXPIRE_TIME }
        );
        const refreshToken = jwt.sign(
          { userEmail: userEmail },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_SECRET }
        );
        userCollection.insertOne(linkedInUser);
        redisClient.set(
          userEmail,
          refreshToken,
          { EX: process.env.REDIS_EXPIRE_TIME },
          (err, reply) => {
            if (err) {
              logger.log({
                level: "error",
                message:
                  "Internal error for user login by using linkedin. | code: 14-2",
              });
              return res
                .status(500)
                .send({ errorMessage: "Something went wrong" });
            }
          }
        );
        logger.log({
          level: "info",
          message:
            "User has been logged in successfully by using linkedIn. | code: 14-3",
        });
        res.status(200).send({
          linkedInSuccessMessageAndInserted:
            "User has been logged in successfully.",
          authToken: authToken,
          refreshToken: refreshToken,
        });
      } else {
        const authToken = jwt.sign(
          { userEmail: result.userEmail },
          process.env.TOKEN_SECRET,
          { expiresIn: process.env.JWT_EXPIRE_TIME }
        );
        const refreshToken = jwt.sign(
          { userEmail: userEmail },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_SECRET }
        );
        redisClient.set(
          userEmail,
          refreshToken,
          { EX: process.env.REDIS_EXPIRE_TIME },
          (err, reply) => {
            if (err) {
              logger.log({
                level: "error",
                message:
                  "Internal error for user login by using linkedin. | code: 14-2",
              });
              return res
                .status(500)
                .send({ errorMessage: "Something went wrong." });
            }
          }
        );
        logger.log({
          level: "error",
          message: "User Already exist for linkedin account. | code: 14-4",
        });
        res.status(200).send({
          linkedInExistingSuccessMessage: "User Already exist.",
          authToken: authToken,
          refreshToken: refreshToken,
        });
      }
    });
  }
);

module.exports = router;
