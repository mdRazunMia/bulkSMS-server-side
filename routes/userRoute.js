const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.js");
const { route } = require("./linkedinRoute.js");


//USER ROUTE
router.post('/registration',userController.userRegistration)
router.get('/user',userController.allUser)
router.post('/login',userController.userLogin)
router.get('/registration/verified/:userEmail/:userPassword',userController.userVerifiedAccount)
router.delete('/delete/:userId',userController.deleteSinglelUser)
// router.post('/forgerPassword', userController.userForgetPassword)
router.post('/passwordResetLink', userController.mailResetLink)
router.post('/userUpdatePassword', userController.userResetPassword)
module.exports = router;