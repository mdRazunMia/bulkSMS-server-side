const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKey.js");
const auth = require("../validations/verify");

router.post("/generation", auth, apiKeyController.generateAPIKey);

module.exports = router;
