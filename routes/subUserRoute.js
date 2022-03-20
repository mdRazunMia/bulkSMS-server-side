const express = require("express");
const router = express.Router();
const subUserController = require("../controllers/subUser.js");
const acl = require("../controllers/acl");
const accessVerify = require("../validations/verifyAccess");

router.post("/create", subUserController.createSubUser);
router.post("/login", subUserController.logInSubUser);
router.get("/showSubUsers", accessVerify, subUserController.showAllSubUser);
// router.get("/showSubUsers", acl, subUserController.showAllSubUser);
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
