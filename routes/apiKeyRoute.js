const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKey.js");

router.post("/generation", apiKeyController.generateAPIKey);

module.exports = router;
