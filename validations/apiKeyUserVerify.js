const database = require("../db/database");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(`${process.env.cryptrSecretKey}`);
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const apiKeyUserVerify = (req, res, next) => {
  const apiSecretKey = req.query.secretKey;
  const apiClientSecretKey = req.query.apiClientSecretKey;
  const decryptApiKey = cryptr.decrypt(apiSecretKey);
  const decryptApiClientKey = cryptr.decrypt(apiClientSecretKey);
  //secret ID
  apiKeyCollection.findOne(
    { apiSecretKey: decryptApiKey, apiClientSecretKey: decryptApiClientKey },
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
