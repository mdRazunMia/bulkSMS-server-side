const express = require("express");
const router = express.Router();
const sendSMSController = require("../controllers/sendSMS");
const apiKeyUserVerify = require("../validations/apiKeyUserVerify");

router.post(
  "/sms-send",
  //   apiKeyUserVerify("send_sms"),
  apiKeyUserVerify,

  sendSMSController.sendSMS
); //para meters have to be passed

module.exports = router;
