const express = require("express");
const router = express.Router();
const jwtApiKeyController = require("../controllers/jwtApiKey");
const auth = require("../validations/verify");
router.post("/jwt-generation", auth, jwtApiKeyController.jwtApiKeyGeneration);

module.exports = router;
