const database = require("../db/database");
const acl = require("./acl");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Str = require("@supercharge/strings");
const subUserCollection = database.GetCollection().subUserCollection();
const {
  subUserCreateValidation,
  subUserLoginValidation,
  subUserEditValidation,
  subUserPasswordResetValidation,
} = require("../validations/validation");
const logger = require("../logger/logger");
const createSubUser = async (req, res) => {
  const { error, value } = subUserCreateValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | code: 15-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  }

  const userRole = req.query.role;
  const subUserName = value.subUserName;
  const password = value.subUserPassword;
  const subUserRole = value.subUserRole;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const subUserPassword = hashedPassword;
  const subUser = {};
  subUser.subUserName = subUserName;
  subUser.subUserPassword = subUserPassword;
  subUser.subUserRole = subUserRole;
  if (userRole === "admin") {
    subUserCollection.insertOne(subUser, (err, data) => {
      if (err) {
        logger.log({
          level: "error",
          message:
            "Internal error for sub-user registration in database. | code: 15-2",
        });
        return res.status(400).send("sub-user is not created.");
      }
      logger.log({
        level: "info",
        message: "Sub-user has been created successfully. | code: 15-3",
      });
      // acl.addUserRoles(subUserName, "sub-admin");
      res.status(201).send({
        successMessage: "Sub-user has been created successfully.",
      });
    });
  } else {
    logger.log({
      level: "warn",
      message: "User is not authorized to create a sub-user. | code: 15-4",
    });
    res.status(403).send("user is not authorized to create a sub-user.");
  }
};

//Login Sub-User
const logInSubUser = (req, res) => {
  const { error, value } = subUserLoginValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | code: 16-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  }
  const subUserName = value.subUserName;
  const subUserPassword = value.subUserPassword;
  const subUserRole = value.subUserRole;
  subUserCollection.findOne(
    { subUserName: subUserName, subUserRole: subUserRole },
    async (error, result) => {
      if (error) {
        logger.log({
          level: "error",
          message:
            "Internal error for sub-user registration in database. | code: 16-2",
        });
        return res.status(500).send({ errorMessage: "Something went wrong." });
      }
      if (!result) {
        logger.log({
          level: "error",
          message: "No user found for this user name. | code: 16-3",
        });
        return res
          .status(404)
          .send({ errorMessage: "No user found for this user name" });
      } else {
        const isValid = await bcrypt.compare(
          subUserPassword,
          result.subUserPassword
        );
        if (isValid) {
          logger.log({
            level: "error",
            message: "Sub-user has been logged in successfully. | code: 16-4",
          });
          // acl(result.subUserRole);
          return res.status(200).send({
            successMessage: "User has been logged in successfully.",
            subUserId: result._id,
            subUserName: result.subUserName,
            subUserRole: result.subUserRole,
          });
        } else {
          logger.log({
            level: "error",
            message: "User password is not correct. | code: 16-5",
          });
          return res.status(401).send({
            errorMessage: "User password is not correct.",
          });
        }
      }
    }
  );
};

//Get all sub-user information
const getSubUserInformationForEdit = (req, res) => {
  const subUserId = req.params.id;
  const role = req.query.role;
  if (role === "admin" || role === "sub-admin") {
    subUserCollection.findOne(
      { _id: ObjectId(subUserId) },
      (error, subUser) => {
        if (error) {
          logger.log({
            level: "error",
            message:
              "Internal error for sub-user edit information function in database. | code: 17-1",
          });
          return res.status(500).send({ errorMessage: "Something went wrong" });
        }
        if (subUser !== null) {
          logger.log({
            level: "info",
            message: "Send the sub user information for updated. | code: 17-2",
          });
          res.status(200).send(subUser);
        } else {
          logger.log({
            level: "error",
            message: "here is no user for this Id. | code: 17-3",
          });
          res
            .status(404)
            .send({ errorMessage: "There is no user for this Id." });
        }
      }
    );
  } else {
    logger.log({
      level: "error",
      message:
        "User is not authorized to edit the sub-user information. | code: 17-4",
    });
    res.status(403).send({
      errorMessage: "User is not authorized to edit the sub-user information.",
    });
  }
};

// Edit sub-user information
const editSubUserInformation = (req, res) => {
  const subUserId = req.params.id;
  const role = req.query.role;
  const { error, value } = subUserEditValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | code: 18-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  }
  const subUserName = value.subUserName;
  const subUserPassword = value.subUserPassword;
  const subUserRole = value.subUserRole;

  if (role === "admin" || role === "sub-admin") {
    subUserCollection.findOne(
      { _id: ObjectId(subUserId) },
      (error, subUser) => {
        if (error) {
          logger.log({
            level: "error",
            message:
              "Internal error for sub-user edit information function in database. | code: 18-2",
          });
          return res.status(500).send({ errorMessage: "Something went wrong" });
        }
        if (subUser !== null) {
          const subUserInformationFilter = { _id: ObjectId(subUserId) };
          const subUserEditedInfo = {
            $set: {
              subUserName: subUserName,
              subUserPassword: subUserPassword,
              subUserRole: subUserRole,
            },
          };
          subUserCollection.updateOne(
            subUserInformationFilter,
            subUserEditedInfo,
            (error, data) => {
              if (error) {
                logger.log({
                  level: "error",
                  message:
                    "Sub-user information has not been updated. | code: 18-4",
                });
                return res.status(400).send({
                  errorMessage: "sub-user information has not been updated.",
                });
              }
              logger.log({
                level: "info",
                message:
                  "Sub-user information has been updated successfully. | code: 18-3",
              });
              return res.status(200).send({
                successMessage:
                  "sub-user information has been updated successfully.",
                data: data,
              });
            }
          );
        } else {
          logger.log({
            level: "error",
            message: "There is no sub-user for this Id. | code: 18-5",
          });
          res
            .status(404)
            .send({ errorMessage: "There is no sub-user for this Id." });
        }
      }
    );
  } else {
    logger.log({
      level: "error",
      message:
        "User is not authorized to edit the sub-user information. | code: 18-6",
    });
    res.status(403).send({
      errorMessage: "User is not authorized to edit the sub-user information.",
    });
  }
};

// update sub-user password
const editSubUserPassword = async (req, res) => {
  const { error, value } = subUserPasswordResetValidation(req.body);
  if (error) {
    const errors = [];
    error.details.forEach((detail) => {
      const currentMessage = detail.message;
      detail.path.forEach((value) => {
        logger.log({
          level: "error",
          message: `${currentMessage} | code: 19-1`,
        });
        errors.push({ [value]: currentMessage });
      });
    });
    // res.status(422).send({ message: error.details[0].message });
    res.status(422).send(errors);
  } else {
    const subUserId = req.params.id;
    const subUserRole = req.query.role;
    const password = req.body.subUserPassword1;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const subUserPassword = hashedPassword;
    if (subUserRole === "admin" || subUserRole === "sub-admin") {
      subUserCollection.findOne(
        { _id: ObjectId(subUserId) },
        (error, subUser) => {
          if (error) {
            logger.log({
              level: "error",
              message:
                "Internal error for sub-user edit password function in database. | code: 19-2",
            });
            return res.send({ errorMessage: "Something went wrong." });
          }
          if (!subUser) {
            logger.log({
              level: "error",
              message: "sub-user is not found. | code: 19-3",
            });
            return res.status(404).send({ errorMessage: "User is not found" });
          } else {
            subUserFilterInfo = { _id: ObjectId(subUserId) };
            subUserUpdatedInfo = { $set: { subUserPassword: subUserPassword } };
            subUserCollection.updateOne(
              subUserFilterInfo,
              subUserUpdatedInfo,
              (error, data) => {
                if (error) {
                  logger.log({
                    level: "error",
                    message: "Sub-user password is not updated. | code: 19-4",
                  });
                  return res.status(400).send({
                    errorMessage: "Sub-user password is not updated.",
                  });
                }
                logger.log({
                  level: "info",
                  message:
                    "Sub-user password has been updated successfully. | code: 19-5",
                });
                return res.status(200).send({
                  successMessage:
                    "User password has been updated successfully.",
                  data: data,
                });
              }
            );
          }
        }
      );
    } else {
      logger.log({
        level: "error",
        message: "User is not authorized to edit the password. | code: 19-6",
      });
      res.status(403).send({
        errorMessage: "User is not authorized to edit the password.",
      });
    }
  }
};

//delete single sub-user
const deleteSubUser = (req, res) => {
  const subUserId = req.params.id;
  const userRole = req.query.role;
  const deletedUserId = { _id: ObjectId(subUserId) };
  if (userRole === "admin") {
    subUserCollection.deleteOne(deletedUserId, (err, data) => {
      if (err) {
        logger.log({
          level: "error",
          message:
            "Internal error for sub-user delete function in database. | code: 20-1",
        });
        return res.status(500).send({ errorMessage: "Something went wrong." });
      }
      logger.log({
        level: "info",
        message: "Sub-user successfully deleted. | code: 20-2",
      });
      res.status(200).send({
        message: `Sub-user has been deleted successfully.`,
      });
    });
  } else {
    logger.log({
      level: "error",
      message: "User is not authorized to delete this sub-user. | code: 20-3",
    });
    res.status(403).send({
      errorMessage: "User is not authorized to delete this sub-user.",
    });
  }
};

//Show all sub-users
const showAllSubUser = async (req, res) => {
  subUserCollection.find({}).toArray((err, result) => {
    if (err) {
      logger.log({
        level: "error",
        message:
          "Internal error for show sub-user function in database. | code: 21-1",
      });
      return res.status(500).send({ errorMessage: "Something went wrong." });
    }
    if (!result) {
      logger.log({
        level: "error",
        message: "There is no sub-user to show. | code: 21-2",
      });
      res.status(404).send({ errorMessage: "There is no sub-user to show." });
    } else {
      logger.log({
        level: "info",
        message: "Send all the sub-users info. | code: 21-3",
      });
      res.status(200).send(result);
    }
  });
};

module.exports = {
  createSubUser,
  editSubUserInformation,
  editSubUserPassword,
  deleteSubUser,
  showAllSubUser,
  getSubUserInformationForEdit,
  logInSubUser,
};
