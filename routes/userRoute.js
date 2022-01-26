const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.js");
const { route } = require("./linkedinRoute.js");
const auth = require('../validations/verified')


//USER ROUTE
router.post('/registration',userController.userRegistration)
router.get('/user',auth,userController.allUser)
router.post('/login',userController.userLogin)
router.get('/registration/verified/:userEmail/:userToken',userController.userVerifiedAccount)
router.delete('/delete/:userId',auth,userController.deleteSinglelUser)
// router.post('/forgerPassword', userController.userForgetPassword)
router.post('/passwordResetLink', userController.mailResetLink)
router.post('/userUpdatePassword',auth,userController.userResetPassword)
//new task
router.get('/userProfile',auth,userController.getUserProfile)
module.exports = router;