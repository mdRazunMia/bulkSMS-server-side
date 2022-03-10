const express = require("express");
const router = express.Router();
const subUserController = require("../controllers/subUser.js");
// const auth = require('../validations/verified')
// let acl = require("acl2");
// acl.allow("sub-admin", ["showSubUsers"], ["view"]);
router.post("/create", subUserController.createSubUser);
router.post("/login", subUserController.logInSubUser);
router.get("/showSubUsers", subUserController.showAllSubUser);
router.delete("/deleteSubUser/:id", subUserController.deleteSubUser);
router.put(
  "/editSubUserInformation/:id",
  subUserController.editSubUserInformation
);
router.get(
  "/getSubUserInformationForEdit/:id",
  subUserController.getSubUserInformationForEdit
);
router.put("/editSubUserPassword/:id", subUserController.editSubUserPassword);

module.exports = router;
