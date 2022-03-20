const jwt = require("jsonwebtoken");
const logger = require("../logger/logger");
const moment = require("moment");

const jwtApiAuth = (role) => {
  return (req, res, next) => {
    const token = req.header("api-auth-token");
    if (!token) {
      logger.log({
        level: "error",
        message: "Authentication for auth token access has been denied. | 11-1",
      });
      return res
        .status(401)
        .send({ invalidAuthTokenMessage: "Access Denied." });
    }
    try {
      const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      req.user = verified;
      console.log(req.user);
      const scopes = req.user.scopes;
      const expireDate = moment(req.user.expireDate).format("YYYY-MM-DD");
      const currentDate = moment(new Date()).format("YYYY-MM-DD");
      const remainingDays = moment(expireDate).diff(currentDate, "days");
      const ipSources = req.user.ipSources;
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
    } catch (error) {
      logger.log({
        level: "error",
        message: "Invalid auth token or time is expired. | code: 11-2",
      });
      res.status(400).send({
        invalidAuthTokenMessage: "Invalid Token or time is expired",
        verify: false,
      });
    }
  };
};

module.exports = jwtApiAuth;
