const express = require("express");
const router = express.Router();
const googleLoginController = require("../controllers/googleLogin")
const auth = require('../validations/verified')


router.post('/googleLogin',googleLoginController.googleLogin)



module.exports = router