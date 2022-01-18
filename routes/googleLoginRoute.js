const express = require("express");
const router = express.Router();
const googleLoginController = require("../controllers/googleLogin")


router.post('/googleLogin',googleLoginController.googleLogin)



module.exports = router