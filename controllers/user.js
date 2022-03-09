const database = require("../db/database");
const nodeMailer = require("nodemailer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Str = require("@supercharge/strings");
const userCollection = database.GetCollection().userCollection();
const {
  registerValidation,
  loginValidation,
  userUpdatePasswordValidation,
  userForgetPasswordValidation,
  updateUserInformationValidation,
} = require("../validations/validation");
const redisInstance = require("../db/redis");

const logger = require("../logger/logger");
const axios = require("axios");

//user registration
const userRegistration = async (req, res) => {
  const { error, value } = registerValidation(req.body);
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
  } else {
    //recaptcha code
    const recapchaVerifyToken = req.body.recaptchaToken;
    const recapchaVerifyURL = `${process.env.RECAPCHA_VERIFY_URL}?secret=${process.env.RECAPCHA_SECRET_KEY}&response=${recapchaVerifyToken}`;
    const recapchaVerifyResponse = await axios.post(recapchaVerifyURL);
    //recaptcha code
    if (!recapchaVerifyResponse.data.success) {
      logger.log({
        level: "error",
        message: "Recaptcha is failed | Code: 1-6",
      });
      res.status(400).send("Recaptcha is failed");
    } else {
      const userFullName = value.userFullName;
      const userEmail = value.userEmail;
      const salt = await bcrypt.genSalt(10);
      const userPassword = await bcrypt.hash(value.userPassword1, salt);
      userCollection.findOne({ userEmail: userEmail }, (err, result) => {
        if (err) {
          logger.log({
            level: "error",
            message: "Internal error for login user in database | Code: 1-2",
          });
          return res.status(500).send({ errorMessage: "Something went wrong" });
        }
        if (result == null) {
          const userInformation = {};
          userInformation.userFullName = userFullName;
          userInformation.userEmail = userEmail;
          userInformation.userPassword = userPassword;
          const userRandomToken = Str.random(50);
          userInformation.userToken = userRandomToken;
          console.log(`user token: ${userRandomToken}`);
          userInformation.verified = false;
          userInformation.medium = "normal";
          userCollection.insertOne(userInformation);
          const transporter = nodeMailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ID,
              pass: process.env.EMAIL_PASSWORD,
            },
          });
          const url = `${process.env.BASE_URL}/verify/${userEmail}/${userRandomToken}`;
          const mailOption = {
            from: process.env.EMAIL_ID,
            to: userEmail,
            subject: "Please Verify your account",
            html: `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Document</title>
                        </head>
                        <body>
                            <div style="margin:30px; padding:20px;"  >
                                <img width="100px" src="https://i.ibb.co/vmVVp11/logo.png"  alt="" />
                               <hr />
                               <div>
                                 <h3 style="font-size:30px;">Please Verify your e-mail to finish signing up for DotOnline</h3>
                                 <p>Thank you for choosing DotOnline</p>
                                 <p> Please confirm that ${userEmail} is your e-mail address by clicking on the button. </p>
                               <a href=${url}>  <button style="color:white; border:0; width:100%; height:50px; border-radius:4px; background-color:#61D2D2;">VERIFY</button></a>
                               </div>
                               <hr />

                               <h4>Need help?Ask at <a href="#">${process.env.OFFICIAL_WEB_ADDRESS}</a> or visit Our <a href="${process.env.OFFICIAL_WEB_ADDRESS_URL}">Help Center</a> </h4>
                              <div style="text-align:center; margin-top:20px;">
                                <h4>DotOnline,Inc.</h4>
                                <h4>${process.env.OFFICE_ADDRESS}</h4>
                              </div>
                               </div>
                        </body>
                        </html>
                        `,
          };
          transporter.sendMail(mailOption, (err, data) => {
            if (err) {
              logger.log({
                level: "error",
                message:
                  "Internal error in node mailer send Mail function | Code: 1-3",
              });
              return res.status(500).send({
                errorMessage: "Something went wrong when sent the mail.",
              });
            }
          });
          logger.log({
            level: "info",
            message:
              "User has been registered successfully. A link has been sent to user E-mail to verify user's account. | Code: 1-4",
          });
          res.status(201).send({
            userRegisterSuccessMessage:
              "User has been registered successfully. A link has been sent to your E-mail to verify your account.",
          });
        } else {
          logger.log({
            level: "warn",
            message: "Email already exist | Code: 1-5",
          });
          res
            .status(400)
            .send({ message: "This email is already registered." });
        }
      });
    }
  }
};

//verify user account
const userVerifiedAccount = (req, res) => {
  const userEmail = req.params.userEmail;
  const userToken = req.params.userRandomToken;
  const userInformation = { userEmail: userEmail, userToken: userToken };
  const updatedUserInformation = { $set: { verified: true } };
  userCollection.updateOne(
    userInformation,
    updatedUserInformation,
    function (err, res) {
      if (err) {
        logger.log({
          level: "error",
          message:
            "Internal error in database at the time of user verify account. | Code: 1-7",
        });
        return res.status(500).send({ errorMessage: "Something went wrong" });
      }
    }
  );
  logger.log({
    level: "info",
    message: "User account has been verified successfully. | Code: 1-8",
  });
  res
    .status(200)
    .send({ verifiedMessage: "Your account has been verified successfully." });
};

//user login
const userLogin = async (req, res) => {
  const redisClient = redisInstance.getRedisClient();
  const { error, value } = loginValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | Code: 2-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  } else {
    if (process.env.LOGIN_RECAPTCHA == "true") {
      //recaptcha code
      const recapchaVerifyToken = req.body.recaptchaToken;
      const recapchaVerifyURL = `${process.env.RECAPCHA_VERIFY_URL}?secret=${process.env.RECAPCHA_SECRET_KEY}&response=${recapchaVerifyToken}`;
      const recapchaVerifyResponse = await axios.post(recapchaVerifyURL);
      //recaptcha code
      if (!recapchaVerifyResponse.data.success) {
        logger.log({
          level: "error",
          message: "Recapcha is failed in user login. | Code: 2-10",
        });
        res.status(200).send("Recaptcha is failed");
      } else {
        const userEmail = value.userEmail;
        const userPassword = value.userPassword;
        userCollection.findOne(
          { userEmail: userEmail },
          async (err, result) => {
            if (err) {
              logger.log({
                level: "error",
                message:
                  "Internal error when user login the system. | Code: 2-2",
              });
              return res
                .status(500)
                .send({ errorMessage: "Something went wrong" });
            }
            if (result != null) {
              if (result.verified && result.medium === "normal") {
                const validPassword = await bcrypt.compare(
                  userPassword,
                  result.userPassword
                );
                if (validPassword) {
                  const token = jwt.sign(
                    { userEmail: result.userEmail },
                    process.env.TOKEN_SECRET,
                    {
                      expiresIn: process.env.JWT_EXPIRE_TIME,
                    }
                  );
                  const refreshToken = jwt.sign(
                    { userEmail: result.userEmail },
                    process.env.REFRESH_TOKEN_SECRET,
                    {
                      expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME,
                    }
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
                            "Internal error in redis client when set the user log in information. | Code: 2-3",
                        });
                        return res
                          .status(500)
                          .send({ errorMessage: "Something went wrong." });
                      }
                    }
                  );
                  const loginMessage = "User successfully logged in.";
                  logger.log({
                    level: "info",
                    message: `${loginMessage}. | code: 2-4`,
                  });
                  // logger.info(`${loginMessage}`,{ code: 2-4, user_id: 123})
                  res.status(200).send({
                    authToken: token,
                    refreshToken: refreshToken,
                  });
                } else {
                  logger.log({
                    level: "error",
                    message: "User password error | Code: 2-5",
                  });
                  return res
                    .status(401)
                    .send({ errorMessage: "Password is incorrect." });
                }
              } else if (result.verified && result.medium === "google") {
                logger.log({
                  level: "warn",
                  message:
                    "User have signed in using google account before. Now, Trying to login manually. | Code: 2-6",
                });
                return res.status(400).send({
                  errorMessage:
                    "You have signed in using google before. Please login using google account",
                });
              } else if (result.verified && result.medium === "linkedIn") {
                logger.log({
                  level: "warn",
                  message:
                    "User have signed in using LinkedIn account before. Now, Trying to login manually. | Code: 2-7",
                });
                return res.status(400).send({
                  errorMessage:
                    "You have signed in using linkedIn before. Please login using google account",
                });
              } else {
                logger.log({
                  level: "warn",
                  message: "Email is not verified. | Code: 2-8",
                });
                return res
                  .status(400)
                  .send({ errorMessage: "Please Verify your email first." });
              }
            } else {
              logger.log({
                level: "error",
                message: "Email incorrect or registered first. | Code: 2-9",
              });
              return res
                .status(400)
                .send({ errorMessage: "Email incorrect or registered first" });
            }
          }
        );
      }
    } else {
      const userEmail = value.userEmail;
      const userPassword = value.userPassword;
      userCollection.findOne({ userEmail: userEmail }, async (err, result) => {
        if (err) {
          logger.log({
            level: "error",
            message: "Internal error when user login the system. | code: 2-2",
          });
          return res.status(500).send({ errorMessage: "Something went wrong" });
        }
        if (result != null) {
          if (result.verified && result.medium === "normal") {
            const validPassword = await bcrypt.compare(
              userPassword,
              result.userPassword
            );
            if (validPassword) {
              const token = jwt.sign(
                { userEmail: result.userEmail },
                process.env.TOKEN_SECRET,
                {
                  expiresIn: process.env.JWT_EXPIRE_TIME,
                }
              );
              const refreshToken = jwt.sign(
                { userEmail: result.userEmail },
                process.env.REFRESH_TOKEN_SECRET,
                {
                  expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME,
                }
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
                        "Internal error in redis client when set the user log in information. | Code: 2-3",
                    });
                    return res
                      .status(500)
                      .send({ errorMessage: "Something went wrong." });
                  }
                }
              );
              const loginMessage = `User successfully logged in.| user id: ${result._id} | Code: 2-4`;
              logger.log({ level: "info", message: loginMessage });
              res.status(200).send({
                authToken: token,
                refreshToken: refreshToken,
              });
            } else {
              logger.log({
                level: "error",
                message: "User password error. | Code: 2-5",
              });
              return res
                .status(401)
                .send({ errorMessage: "Password is incorrect." });
            }
          } else if (result.verified && result.medium === "google") {
            logger.log({
              level: "warn",
              message:
                "User have signed in using google account before. Now, Trying to login manually. | Code: 2-6",
            });
            return res.status(400).send({
              errorMessage:
                "You have signed in using google before. Please login using google account",
            });
          } else if (result.verified && result.medium === "linkedIn") {
            logger.log({
              level: "warn",
              message:
                "User have signed in using LinkedIn account before. Now, Trying to login manually.  | Code: 2-7",
            });
            return res.status(400).send({
              errorMessage:
                "You have signed in using linkedIn before. Please login using google account",
            });
          } else {
            logger.log({
              level: "warn",
              message: "Email is not verified | Code: 2-8",
            });
            return res
              .status(400)
              .send({ errorMessage: "Please Verify your email first." });
          }
        } else {
          logger.log({
            level: "error",
            message: "Email incorrect or registered first. | Code: 2-9",
          });
          return res
            .status(400)
            .send({ errorMessage: "Email incorrect or registered first" });
        }
      });
    }
  }
};

// send reset mail
const mailForgetPasswordResetLink = (req, res) => {
  const userEmail = req.body.userEmail;
  userCollection.findOne({ userEmail: userEmail }, (err, user) => {
    if (err) {
      logger.log({
        level: "error",
        message:
          "Internal error in database when user try to reset password. | code: 3-1",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    if (user == null) {
      logger.log({
        level: "error",
        message: "Email is not registered. | code: 3-1",
      });
      res.status(400).send({
        resetPasswordErrorMessage:
          "This email is not registered. Please registered this email first.",
      });
    } else if (user.verified && user.medium === "normal") {
      const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_ID,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const url = `${process.env.BASE_URL}/resetPassword/userEmail=${userEmail}`;
      const mailOption = {
        from: process.env.EMAIL_ID,
        to: userEmail,
        subject: "Please Verify your account",
        html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                </head>
                <body>
                    <div style="margin:30px; padding:20px;"  >
                        <img width="100px" src="https://i.ibb.co/vmVVp11/logo.png"  alt="" />   
                       <hr />
                       <div>
                         <p>Thank you for choosing DotOnline</p>
                         <p> Please confirm that ${userEmail} is your e-mail address and click the verify button to change your password. </p>
                       <a href=${url}>  <button style="color:white; border:0; width:100%; height:50px; border-radius:4px; background-color:#61D2D2;">VERIFY</button></a>
                       </div>
                       <hr />
                
                       <h4>Need help?Ask at <a href="#">${process.env.OFFICE_ADDRESS}</a> or visit Our <a href="${process.env.OFFICIAL_WEB_ADDRESS}">Help Center</a> </h4>
                      <div style="text-align:center; margin-top:20px;">
                        <h4>DotOnline,Inc.</h4>
                        <h4>${process.env.OFFICE_ADDRESS}</h4>
                      </div>
                       </div>
                </body>
                </html>
                `,
      };
      transporter.sendMail(mailOption, (err, data) => {
        if (err) {
          logger.log({
            level: "error",
            message:
              "Internal error in node mailer send Mail function. | code: 3-3",
          });
          return res.status(500).send({ errorMessage: "Something went wrong" });
        }
      });
      logger.log({
        level: "info",
        message:
          "A reset password link has been sent to the mail of the user. | code: 3-4",
      });
      res.status(200).send({
        resetPasswordMessage:
          "A link has been sent to your gmail to reset your password.",
      });
    } else if (user.verified && user.medium === "google") {
      logger.log({
        level: "warn",
        message:
          "user cannot reset password. Because user logged in using google account. | code: 3-5",
      });
      return res.status(401).send({
        errorMessage:
          "You cannot reset your password. Because you have signed in using google account before. Please login using google account",
      });
    } else {
      logger.log({
        level: "warn",
        message:
          "user cannot reset password. Because user logged in using linkedIn account. | code: 3-6",
      });
      return res.status(401).send({
        errorMessage:
          "You cannot reset your password. Because you have signed in using linkedin account before. Please login using linkedin account",
      });
    }
  });
};

//user Forget password
const userForgetPassword = async (req, res) => {
  const userEmail = req.query.userEmail;
  const { error, value } = userForgetPasswordValidation(req.body);
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
  } else {
    const userNewPassword = req.body.userPassword1;
    const salt = await bcrypt.genSalt(10);
    const hashedUserNewPassword = await bcrypt.hash(userNewPassword, salt);
    userCollection.findOne({ userEmail: userEmail }, async (err, user) => {
      if (err) {
        logger.log({
          level: "error",
          message: "Internal error in user forget password. | code: 4-2",
        });
        return res.status(500).send({ errorMessage: "Something went wrong." });
      }
      if (user == null) {
        logger.log({
          level: "error",
          message:
            "There is no user to update the password. Please register first. | | code: 4-3",
        });
        res.status(404).send({
          message:
            "There is no user to update the password. Please register first.",
        });
      } else {
        const userInformation = { userEmail: userEmail };
        const updatedUserInformation = {
          $set: { userPassword: hashedUserNewPassword },
        };
        userCollection.updateOne(
          userInformation,
          updatedUserInformation,
          function (err, object) {
            if (err) {
              logger.log({
                level: "error",
                message: "Internal error in user forget password.| code: 4-2",
              });
              return res
                .status(500)
                .send({ errorMessage: "Something went wrong" });
            }
            logger.log({
              level: "info",
              message:
                "User password has been updated successfully. | code: 4-4",
            });
            res.status(200).send({
              updateSuccessMessage:
                "user password has been updated successfully.",
            });
          }
        );
      }
    });
  }
};

// user update password
const userUpdatePassword = (req, res) => {
  const { error, value } = userUpdatePasswordValidation(req.body);
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
  } else {
    const userCurrentPassword = value.userCurrentPassword;
    const userId = req.query.id;
    const userNewPassword = value.userPassword1;
    userCollection.findOne({ _id: ObjectId(userId) }, async (err, user) => {
      if (err) {
        logger.log({
          level: "error",
          message:
            "Internal error in user update password function. | code: 5-2",
        });
        return res.status(500).send({ errorMessage: "Something went wrong" });
      }
      if (user == null) {
        logger.log({
          level: "error",
          message: "There is no user to update. | code: 5-3",
        });
        res.status(404).send({ message: "There is no user to update." });
      } else {
        const isValidPassword = await bcrypt.compare(
          userCurrentPassword,
          user.userPassword
        );
        if (!isValidPassword) {
          logger.log({
            level: "error",
            message:
              "Current password is not matched wih the given current password. | code: 5-5",
          });
          return res.status(401).send({
            passwordNotMatchedError:
              "Current password is not matched wih the given current password.",
          });
        } else {
          const userInformation = { _id: ObjectId(userId) };
          const salt = await bcrypt.genSalt(10);
          const hashedUserNewPassword = await bcrypt.hash(
            userNewPassword,
            salt
          );
          const updatedUserInformation = {
            $set: { userPassword: hashedUserNewPassword },
          };
          userCollection.updateOne(
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
                message:
                  "User password has been updated successfully. | | code: 5-4",
              });
              res.status(200).send({
                updateSuccessMessage:
                  "user password has been updated successfully.",
              });
            }
          );
        }
      }
    });
  }
};

//update user information
const updateUserInformation = (req, res) => {
  const userEmailParam = req.params.userEmail;
  const { error, value } = updateUserInformationValidation(req.body);
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
  const userFullName = value.userFullName;
  const userEmail = value.userEmail;
  const userPassword = value.userPassword;
  userCollection.findOne({ userEmail: userEmailParam }, async (error, user) => {
    if (error) {
      logger.log({
        level: "error",
        message:
          "Internal error in user update information function. | code: 6-2",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    if (user == null) {
      logger.log({
        level: "error",
        message: "User is not available to update the information. | code: 6-3",
      });
      return res.status(400).send({
        errorMessage: "User is not available to update the information.",
      });
    } else {
      const userInformation = { userEmail: userEmailParam };
      const salt = await bcrypt.genSalt(10);
      const hashedUserNewPassword = await bcrypt.hash(userPassword, salt);
      const updatedUserInformation = {
        $set: {
          userFullName: userFullName,
          userEmail: userEmail,
          userPassword: hashedUserNewPassword,
        },
      };
      userCollection.updateOne(
        userInformation,
        updatedUserInformation,
        function (err, object) {
          if (err) {
            logger.log({
              level: "error",
              message:
                "Internal error in user update information function. | code: 6-2",
            });
            return res
              .status(500)
              .send({ errorMessage: "Something went wrong" });
          }
          logger.log({
            level: "info",
            message:
              "user information has been updated successfully. | code: 6-4",
          });
          return res.status(200).send({
            updateSuccessMessage:
              "user information has been updated successfully.",
          });
        }
      );
    }
  });
};

// get all users
const allUser = (req, res) => {
  userCollection.find({}).toArray((err, result) => {
    logger.log({ level: "info", message: "Get all users. | code: 7-1" });
    res.status(200).send(result);
  });
};

// delete single user
const deleteSingleUser = (req, res) => {
  const userId = req.params.userId;
  var deletedUserId = { _id: ObjectId(userId) };
  userCollection.deleteOne(deletedUserId, (err, data) => {
    if (err) {
      logger.log({
        level: "error",
        message: "Internal error in user delete function. | code: 8-1",
      });
      return res.status(500).send({ errorMessage: "Something went wrong" });
    }
    logger.log({
      level: "info",
      message: "User has been deleted successfully. | code: 8-2",
    });
    res.status(200).send({
      message: `User has been deleted successfully`,
    });
  });
};

// get all the info of requested user
const getUserProfile = (req, res) => {
  const userEmail = req.user.userEmail;
  userCollection.find({ userEmail: userEmail }).toArray((err, result) => {
    let user = {};
    user.userFullName = result[0].userFullName;
    user.userEmail = result[0].userEmail;
    logger.log({
      level: "info",
      message: "Get all the info of requested user after login. | code: 9-1",
    });
    res.status(200).send({ user: user });
  });
};

//user refresh token
const userRefreshToken = async (req, res) => {
  const redisClient = redisInstance.getRedisClient();
  const refreshToken = req.header("refresh-token");
  if (!refreshToken) {
    logger.log({
      level: "error",
      message: "Access denied because token is not available. | code: 10-1",
    });
    return res.status(401).send({ errorMessage: "Access Denied." });
  }
  const verified = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const userEmail = verified.userEmail;
  const redisUserEmail = await redisClient.get(userEmail);
  if (redisUserEmail === null) {
    logger.log({
      level: "info",
      message: "Login first before get refresh token. | code: 10-4",
    });
    return res.status(401).send({ errorMessage: "Please login first" });
  } else {
    try {
      const authToken = jwt.sign(
        { userEmail: userEmail },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_EXPIRE_TIME }
      );
      logger.log({
        level: "info",
        message:
          "Authentication and refresh token have been sent. | code: 10-5",
      });
      res.status(200).send({ authToken: authToken });
    } catch (error) {
      logger.log({
        level: "error",
        message: "Internal error in refresh token function. | code: 10-6",
      });
      res
        .status(500)
        .send({ userRefreshTokenErrorMessage: "Something went wrong." });
    }
  }
};

const userLogOut = (req, res) => {
  const redisClient = redisInstance.getRedisClient();
  const userEmail = req.user.userEmail;
  redisClient.del(userEmail);
  logger.log({
    level: "info",
    message: "User has been logged out successfully. | 12-1",
  });
  res
    .status(200)
    .send({ userLogoutMessage: "User has been logged out successfully." });
};

module.exports = {
  userRegistration,
  userLogin,
  allUser,
  deleteSingleUser,
  userVerifiedAccount,
  userUpdatePassword,
  mailForgetPasswordResetLink,
  userForgetPassword,
  updateUserInformation,
  getUserProfile,
  userRefreshToken,
  userLogOut,
};
