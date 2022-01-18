const express = require("express");
const router = express.Router();
const logOutController = require("../controllers/logout.js");


router.get('/',logOutController)

module.exports = router