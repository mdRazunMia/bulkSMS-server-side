const AccessControl = require("accesscontrol");
let grantObject = require("../constants/accessGrantList");
const ac = new AccessControl(grantObject);
// ac.grant("sub-admin").readAny("showSubUsers");
// ac.grant("admin").readAny("showSubUsers");
const accessVerify = (req, res, next) => {
  console.log(req.query.role);
  console.log(ac);
  const permission =
    ac.can(`${req.query.role}`).readAny("showSubUsers") ||
    ac.can(`${req.query.role}`).deleteAny("showSubUsers") ||
    ac.can(`${req.query.role}`).updateAny("showSubUsers");
  if (permission.granted) {
    next();
  } else {
    return res.status(403).send({ errorMessage: "Access denied." });
  }
};

module.exports = accessVerify;
