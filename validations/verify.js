const jwt = require("jsonwebtoken");
const logger = require("../logger/logger");

const auth = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    logger.log({
      level: "error",
      message: "Authentication for auth token access has been denied. | 11-1",
    });
    return res.status(401).send({ invalidAuthTokenMessage: "Access Denied." });
  }
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    logger.log({
      level: "error",
      message: "Invalid auth token or time is expired. | code: 11-2",
    });
    res
      .status(400)
      .send({
        invalidAuthTokenMessage: "Invalid Token or time is expired",
        verify: false,
      });
  }
};

module.exports = auth;
