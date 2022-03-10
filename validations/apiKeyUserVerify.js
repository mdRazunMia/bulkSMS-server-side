const database = require("../db/database");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const apiKeyUserVerify = (req, res, next) => {
  const userId = req.query.userId;
  const secretKey = req.query.secretKey;
  apiKeyCollection.findOne(
    { userId: userId, apiSecretKey: secretKey },
    (error, result) => {
      if (error)
        return res.status(500).send({ errorMessage: "Internal error." });
      if (!result) {
        return res.status(403).send({ errorMessage: "Access denied" });
      } else {
        const scopes = result.scopes;
        const ipSources = result.ipSources;
        const hostIp = "192.168.0.1"; // req.hostname
        if (
          scopes.includes("sms send") ||
          scopes.includes("sms report") ||
          scopes.includes("sms-balance")
        ) {
          if (ipSources.includes(hostIp)) {
            next();
          } else {
            return res
              .status(403)
              .send({ errorMessage: "Permission denied for this IP." });
          }
        } else {
          return res
            .status(403)
            .send({ errorMessage: "Permission denied for this route." });
        }
      }
    }
  );
};

module.exports = apiKeyUserVerify;
