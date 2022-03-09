const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKey.js");

router.post("/sign-up", apiKeyController.apiKeyGenerationSignUP);
router.post("/log-in", apiKeyController.apiKeyGenerationLogIn);
router.post("/generation", apiKeyController.generateAPIKey);
router.get("/show", apiKeyController.showAPIKey);

module.exports = router;
