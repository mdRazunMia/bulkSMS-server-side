const database = require("../db/database");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const apiKeyUserVerify = (req, res, next) => {
  // const userId = req.query.userId;
  const secretKey = req.query.secretKey;
  //secret ID
  apiKeyCollection.findOne(
    { userId: userId, apiSecretKey: secretKey },
    (error, result) => {
      if (error)
        return res.status(500).send({ errorMessage: "Internal error." });
      if (!result) {
        return res.status(403).send({ errorMessage: "Access denied" });
      } else {
        const scopes = result.scopes;
        const expireDate = result.expireDate;
        const ipSources = result.ipSources;
        const hostIp = "192.168.0.1"; // req.hostname
        //first date has to check then other checking will be performed
        if (expireDate) {
        }
        // scopes checking >0
        if (
          scopes.includes("sms send") ||
          scopes.includes("sms report") ||
          scopes.includes("sms-balance")
        ) {
          //ipSource >0
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
