const express = require("express");
const router = express.Router();
const sendSMSJwtController = require("../controllers/sendSMSJwt");
const jwtApiAuth = require("../validations/jwtApiKeyUserVerify");

router.post(
  "/jwt-sms-send",
  jwtApiAuth("sms_send"),
  sendSMSJwtController.sendSMSJwt
); //para meters have to be passed

module.exports = router;
