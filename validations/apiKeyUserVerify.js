const database = require("../db/database");
// const Cryptr = require("cryptr");
// const cryptr = new Cryptr(`${process.env.cryptrSecretKey}`);
const md5 = require("md5");
const apiKeyCollection = database.GetCollection().apiKeyCollection();
const apiKeyUserVerify = (req, res, next) => {
  const apiKey = md5(req.query.apiKey);
  const apiClientId = md5(req.query.clientId);
  // const encryptApiKey = cryptr.encrypt(apiSecretKey);
  // console.log(encryptApiKey);
  // const encryptApiClientKey = cryptr.encrypt(apiClientSecretKey);
  // console.log(encryptApiClientKey);
  // secret ID
  apiKeyCollection.findOne(
    { apiKey: apiKey, apiClientId: apiClientId },
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
        // if (expireDate) {
        // }
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
