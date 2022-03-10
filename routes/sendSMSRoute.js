const express = require("express");
const router = express.Router();
const sendSMSController = require("../controllers/sendSMS");
const apiKeyUserVerify = require("../validations/apiKeyUserVerify");

router.post("/sms-send", apiKeyUserVerify, sendSMSController.sendSMS);

module.exports = router;
