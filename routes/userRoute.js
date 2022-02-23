const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.js");
const auth = require('../validations/verify')
const authRefreshToken = require('../validations/refreshTokenVerify')



router.post('/registration',userController.userRegistration)
router.get('/showUsers',auth,userController.allUser)
router.post('/login',userController.userLogin)
router.get('/registration/verify/:userEmail/:userRandomToken',userController.userVerifiedAccount)
router.delete('/delete/:userId',auth,userController.deleteSingleUser)
router.post('/forgetPasswordResetLink', userController.mailForgetPasswordResetLink)
router.post('/forgetPassword', userController.userForgetPassword)
router.post('/userUpdatePassword',auth,userController.userUpdatePassword)
router.get('/userProfile',auth,userController.getUserProfile)
router.put('/updateUserInformation/:userEmail',auth,userController.updateUserInformation)
router.get('/refreshToken',authRefreshToken,userController.userRefreshToken)
router.get('/logout',authRefreshToken,userController.userLogOut)


module.exports = router;