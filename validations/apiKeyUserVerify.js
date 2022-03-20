const database = require("../db/database");
const md5 = require("md5");
const moment = require("moment");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const apiKeyUserVerify = (role) => {
  return (req, res, next) => {
    const apiKey = md5(req.query.apiKey);
    const apiClientId = md5(req.query.clientId);
    apiKeyCollection.findOne(
      { apiKey: apiKey, apiClientId: apiClientId },
      (error, result) => {
        if (error)
          return res.status(500).send({ errorMessage: "Internal error." });
        if (!result) {
          return res.status(403).send({ errorMessage: "Access denied" });
        } else {
          const scopes = result.scopes;
          const expireDate = moment(result.expireDate).format("YYYY-MM-DD");
          const currentDate = moment(new Date()).format("YYYY-MM-DD");
          const remainingDays = moment(expireDate).diff(currentDate, "days");
          const ipSources = result.ipSources;
          const hostIp = "192.168.0.1"; // req.hostname
          if (remainingDays < 0) {
            return res
              .status(403)
              .send({ errorMessage: "API key and Client ID time is expired." });
          }
          if (scopes.length > 0 || ipSources.length > 0) {
            if (scopes.includes(role)) {
              if (ipSources.length > 0) {
                if (ipSources.includes(hostIp)) {
                  next();
                } else {
                  return res
                    .status(403)
                    .send({ errorMessage: "Permission denied for this IP." });
                }
              } else {
                next();
              }
            } else {
              return res
                .status(403)
                .send({ errorMessage: "Permission denied for this route." });
            }
          } else {
            next();
          }
        }
      }
    );
  };
};

module.exports = apiKeyUserVerify;
