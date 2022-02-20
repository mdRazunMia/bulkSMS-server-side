const database = require('../db/database')
const nodeMailer = require('nodemailer')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Str = require('@supercharge/strings')
const  userCollection = database.collection("user")
const {
    registerValidation,loginValidation, 
    userUpdatePasswordValidation, 
    userForgetPasswordValidation,
    updateUserInformationValidation
} = require('../validations/validation')
const redisClient  = require('../db/redis')
const logger = require('../logger/logger')
const axios = require("axios")
const { level } = require('../logger/logger')


// const createDatabase = require('../db/database')

// const database = createDatabase.createDatabase()
// console.log(database)
// const userCollection = database.collection("user")




//user registration
const userRegistration = async (req, res)=>{
    const {error, value} = registerValidation(req.body) 
    if(error){
        logger.log({level: 'error', message: error.details[0].message})
        res.status(400).send({message: error.details[0].message})
    }else{
        //recaptcha code
        const recapchaVerifyToken = req.body.recaptchaToken
        const recapchaVerifyURL = `${process.env.RECAPCHA_VERIFY_URL}?secret=${process.env.RECAPCHA_SECRET_KEY}&response=${recapchaVerifyToken}`
        const recapchaVerifyResponse = await axios.post(recapchaVerifyURL)
         //recaptcha code
        if(recapchaVerifyResponse.data.success){
            const userFullName = value.userFullName
            const userEmail = value.userEmail
            const salt = await bcrypt.genSalt(10)
            const userPassword = await bcrypt.hash(value.userPassword1, salt)
            userCollection.findOne({userEmail: userEmail}, (err, result)=>{
                if(err){
                    logger.log({level: 'error', message: 'Internal error for login user in database'})
                    return res.status(500).send({errorMessage: "Something went wrong"})
                } 
                if(result == null){
                    const userInformation = {}
                    userInformation.userFullName = userFullName
                    userInformation.userEmail = userEmail
                    userInformation.userPassword = userPassword
                    const userRandomToken = Str.random(50)
                    userInformation.userToken = userRandomToken
                    console.log(`user token: ${userRandomToken}`)
                    userInformation.verified = false
                    userInformation.medium= "normal"
                    userCollection.insertOne(userInformation)
                    const transporter = nodeMailer.createTransport({
                        service: "gmail",
                        auth:{
                            user:process.env.EMAIL_ID,
                            pass:process.env.EMAIL_PASSWORD
                        }
                    })
                    const url = `${process.env.BASE_URL}/verify/${userEmail}/${userRandomToken}`
                    const mailOption ={
                        from: process.env.EMAIL_ID,
                        to: userEmail,
                        subject: 'Please Verify your account',
                        html: `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Document</title>
                        </head>
                        <body>
                            <div style="margin:30px; padding:20px;"  >
                                <img width="100px" src="https://i.ibb.co/vmVVp11/logo.png"  alt="" />   
                               <hr />
                               <div>
                                 <h3 style="font-size:30px;">Please Verify your e-mail to finish signing up for DotOnline</h3>
                                 <p>Thank you for choosing DotOnline</p>
                                 <p> Please confirm that ${userEmail} is your e-mail address by clicking on the button. </p>
                               <a href=${url}>  <button style="color:white; border:0; width:100%; height:50px; border-radius:4px; background-color:#61D2D2;">VERIFY</button></a>
                               </div>
                               <hr />
                        
                               <h4>Need help?Ask at <a href="#">${process.env.OFFICIAL_WEB_ADDRESS}</a> or visit Our <a href="${process.env.OFFICIAL_WEB_ADDRESS_URL}">Help Center</a> </h4>
                              <div style="text-align:center; margin-top:20px;">
                                <h4>DotOnline,Inc.</h4>
                                <h4>${process.env.OFFICE_ADDRESS}</h4>
                              </div>
                               </div>
                        </body>
                        </html>
                        `
                    }
                    transporter.sendMail(mailOption, (err, data )=>{
                        if(err) {
                        logger.log({level: 'error', message: 'Internal error in node mailer send Mail function'})
                        return res.status(500).send({errorMessage: "Something went wrong when sent the mail."})
                        }
                    })
                    logger.log({level: 'info', message: 'User has been registered successfully. A link has been sent to user gmail to verify user\'s account.'})
                    res.status(201).send({ userRegisterSuccessMessage: "User has been registered successfully. A link has been sent to your gmail to verify your account."})
                }else{
                    logger.log({level: 'warn', message: 'Email already exist'})
                    res.status(400).send({ message: "This email is already registered."})
                }
            })
        }else{
            logger.log({level: 'error', message: 'Recaptcha is failed'})
            res.status(400).send("Recaptcha is failed")
        }
    }


}


//verify user account
const userVerifiedAccount = (req, res)=>{
    const userEmail = req.params.userEmail
    const userToken = req.params.userRandomToken
    const userInformation = { userEmail: userEmail, userToken: userToken};
    const updatedUserInformation = { $set: {verified: true} };
    userCollection.updateOne(userInformation, updatedUserInformation, function(err, res) {
    if (err) {
        logger.log({level: 'error', message: 'Internal error in database at the time of user verify account.'})
        return res.status(500).send({errorMessage: "Something went wrong"})
    }
  });
  logger.log({level:'info', message: 'User account has been verified successfully.'})
  res.status(200).send({ verifiedMessage: "Account has been verified successfully."})
}


//user login
const userLogin = async (req, res)=>{
    const {error, value} = loginValidation(req.body)
    if(error){
        logger.log({level: 'error', message: error.details[0].message})
        res.status(400).send({errorMessage: error.details[0].message})
    }else{
        
       if(process.env.LOGIN_RECAPTCHA==true){
        //recaptcha code
       const recapchaVerifyToken = req.body.recaptchaToken
       const recapchaVerifyURL = `${process.env.RECAPCHA_VERIFY_URL}?secret=${process.env.RECAPCHA_SECRET_KEY}&response=${recapchaVerifyToken}`
       const recapchaVerifyResponse = await axios.post(recapchaVerifyURL)
         //recaptcha code
       if(recapchaVerifyResponse.data.success){
            const userEmail = value.userEmail
            const userPassword = value.userPassword
            userCollection.findOne({userEmail: userEmail}, async (err, result)=>{
                if(err) {
                    logger.log({level: 'error', message: 'Internal error when user login the system.'})
                    return res.status(500).send({errorMessage: "Something went wrong"})
                }
                if(result != null){
                    if(result.verified && result.medium === "normal"){ 
                        const validPassword = await bcrypt.compare(userPassword,result.userPassword)
                        if(validPassword){
                            const token = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET, {
                                expiresIn: process.env.JWT_EXPIRE_TIME
                            })
                            const refreshToken = jwt.sign({userEmail: result.userEmail}, process.env.REFRESH_TOKEN_SECRET,{
                                expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME
                            })
                            redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
                                if(err) {
                                    logger.log({level: 'error', message: 'Internal error in redis client when set the user log in information.'})
                                    return res.status(500).send({errorMessage:"Something went wrong."})
                                }
                            })
                            const loginMessage = "User successfully logged in. "
                            logger.log({level: 'info', message: loginMessage})
                            res.status(200).send({
                                authToken: token,
                                refreshToken: refreshToken
                            })
                        }else{
                            logger.log({level: 'error', message: 'User password error'})
                            return res.status(401).send({ errorMessage: "Password is incorrect."})
                        }
                    }else if(result.verified && result.medium === "google"){
                        logger.log({level: 'warn', message: 'User have signed in using google account before. Now, Trying to login manually.'})
                        return res.status(400).send({errorMessage: "You have signed in using google before. Please login using google account"})
                    }else if(result.verified && result.medium === "linkedIn"){
                        logger.log({level: 'warn', message: 'User have signed in using LinkedIn account before. Now, Trying to login manually.'})
                        return res.status(400).send({errorMessage: "You have signed in using linkedIn before. Please login using google account"})
                    }else{
                        logger.log({level: 'warn', message: 'Email is not verified'})
                        return res.status(400).send({ errorMessage: "Please Verify your email first."})
                    }
                }else{
                    logger.log({level: 'error', message: 'Email incorrect or registered first.'})
                    return  res.status(400).send({errorMessage: "Email incorrect or registered first"})
                }
                
            })
       }else{
           res.status(200).send("Recaptcha is failed")
       }
    }else{
        const userEmail = value.userEmail
            const userPassword = value.userPassword
            userCollection.findOne({userEmail: userEmail}, async (err, result)=>{
                if(err) {
                    logger.log({level: 'error', message: 'Internal error when user login the system.'})
                    return res.status(500).send({errorMessage: "Something went wrong"})
                }
                if(result != null){
                    if(result.verified && result.medium === "normal"){ 
                        const validPassword = await bcrypt.compare(userPassword,result.userPassword)
                        if(validPassword){
                            const token = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET, {
                                expiresIn: process.env.JWT_EXPIRE_TIME
                            })
                            const refreshToken = jwt.sign({userEmail: result.userEmail}, process.env.REFRESH_TOKEN_SECRET,{
                                expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME
                            })
                            redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
                                if(err) {
                                    logger.log({level: 'error', message: 'Internal error in redis client when set the user log in information.'})
                                    return res.status(500).send({errorMessage:"Something went wrong."})
                                }
                            })
                            const loginMessage = "User successfully logged in. "
                            logger.log({level: 'info', message: loginMessage})
                            res.status(200).send({
                                authToken: token,
                                refreshToken: refreshToken
                            })
                        }else{
                            logger.log({level: 'error', message: 'User password error'})
                            return res.status(401).send({ errorMessage: "Password is incorrect."})
                        }
                    }else if(result.verified && result.medium === "google"){
                        logger.log({level: 'warn', message: 'User have signed in using google account before. Now, Trying to login manually.'})
                        return res.status(400).send({errorMessage: "You have signed in using google before. Please login using google account"})
                    }else if(result.verified && result.medium === "linkedIn"){
                        logger.log({level: 'warn', message: 'User have signed in using LinkedIn account before. Now, Trying to login manually.'})
                        return res.status(400).send({errorMessage: "You have signed in using linkedIn before. Please login using google account"})
                    }else{
                        logger.log({level: 'warn', message: 'Email is not verified'})
                        return res.status(400).send({ errorMessage: "Please Verify your email first."})
                    }
                }else{
                    logger.log({level: 'error', message: 'Email incorrect or registered first.'})
                    return  res.status(400).send({errorMessage: "Email incorrect or registered first"})
                }
                
            })
    }
}}


// send reset mail
const mailForgetPasswordResetLink = (req, res)=>{
    const userEmail = req.body.userEmail
    userCollection.findOne({userEmail: userEmail},(err, user)=>{
        if(err) {
            logger.log({level: 'error', message: 'Internal error in database when user try to reset password.'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }   
        if(user==null){
            logger.log({ level: 'error', message: 'Email is not registered.'})
            res.status(400).send({resetPasswordErrorMessage: "This email is not registered. Please registered this email first."})
        }else if(user.verified && user.medium === "normal"){
            const transporter = nodeMailer.createTransport({
                service: "gmail",
                auth:{
                    user:process.env.EMAIL_ID,
                    pass:process.env.EMAIL_PASSWORD
                }
            }) 
            const url = `${process.env.BASE_URL}/resetPassword/userEmail=${userEmail}`
            const mailOption ={
                from: process.env.EMAIL_ID,
                to: userEmail,
                subject: 'Please Verify your account',
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                </head>
                <body>
                    <div style="margin:30px; padding:20px;"  >
                        <img width="100px" src="https://i.ibb.co/vmVVp11/logo.png"  alt="" />   
                       <hr />
                       <div>
                         <p>Thank you for choosing DotOnline</p>
                         <p> Please confirm that ${userEmail} is your e-mail address and click the verify button to change your password. </p>
                       <a href=${url}>  <button style="color:white; border:0; width:100%; height:50px; border-radius:4px; background-color:#61D2D2;">VERIFY</button></a>
                       </div>
                       <hr />
                
                       <h4>Need help?Ask at <a href="#">${process.env.OFFICE_ADDRESS}</a> or visit Our <a href="${process.env.OFFICIAL_WEB_ADDRESS}">Help Center</a> </h4>
                      <div style="text-align:center; margin-top:20px;">
                        <h4>DotOnline,Inc.</h4>
                        <h4>${process.env.OFFICE_ADDRESS}</h4>
                      </div>
                       </div>
                </body>
                </html>
                `
            }
            transporter.sendMail(mailOption, (err, data )=>{
                if(err) {
                    logger.log({level: 'error', message: 'Internal error in node mailer send Mail function'})
                    return res.status(500).send({errorMessage: "Something went wrong"})
                }
            })
            logger.log({level: 'info', message: 'A reset password link has been sent to the mail of the user.'})
            res.status(200).send({ resetPasswordMessage: "A link has been sent to your gmail to reset your password."})
        }else if(user.verified && user.medium === "google"){
            logger.log({level: 'warn', message: 'user cannot reset password. Because user logged in using google account'})
            return res.status(401).send({ errorMessage: "You cannot reset your password. Because you have signed in using google account before. Please login using google account"})
        }else{
            logger.log({level: 'warn', message: 'user cannot reset password. Because user logged in using linkedIn account'})
            return res.status(401).send({ errorMessage: "You cannot reset your password. Because you have signed in using linkedin account before. Please login using linkedin account"})
        }
    })
}

//user Forget password
const userForgetPassword = async(req, res)=>{
    const userEmail = req.query.userEmail
   const {error, value} = userForgetPasswordValidation(req.body)
   if(error){
        logger.log({level: 'error', message: error.details[0].message})
        res.status(400).send(error.details[0].message)
   }else{
    const userNewPassword = req.body.userPassword1
    const salt = await bcrypt.genSalt(10)
    const hashedUserNewPassword =  await bcrypt.hash(userNewPassword, salt)
    userCollection.findOne({userEmail: userEmail},async(err, user)=>{
        if(err){
            logger.log({level: 'error', message: 'Internal error in user forget password'})
            return res.status(500).send({ errorMessage: "Something went wrong."})
        } 
        if(user==null){
            logger.log({ level: 'error', message: 'There is no user to update the password. Please register first.'})
            res.send({message: "There is no user to update the password. Please register first."})
        }else{
            const userInformation = { userEmail: userEmail};
            const updatedUserInformation = { $set: {userPassword: hashedUserNewPassword} };
            userCollection.updateOne(userInformation, updatedUserInformation, function(err, object) {
                if (err) {
                    logger.log({level: 'error', message: 'Internal error in user forget password'})
                    return res.status(500).send({errorMessage: "Something went wrong"})
                }
                logger.log({ level: 'info', message: 'User password has been updated successfully.'})
                res.status(200).send({ updateSuccessMessage:"user password has been updated successfully."})
            });
        }
    })
   }
}


// user update password
const userUpdatePassword = (req, res)=>{
    const {error, value} = userUpdatePasswordValidation(req.body)
    if(error){
        logger.log({level: 'error', message: error.details[0].message})
        res.send({ message: error.details[0].message})
    }else{
        const userCurrentPassword = value.userCurrentPassword
        const userId = req.query.id
        const userNewPassword = value.userPassword1
        userCollection.findOne({_id: ObjectId(userId)},async(err, user)=>{
            if(err){
                logger.log({level: 'error', message: 'Internal error in user update password function'})
                return res.status(500).send({errorMessage: "Something went wrong"})
            } 
            if(user==null){
                logger.log({level: 'error', message: 'There is no user to update.'})
                res.send({message: "There is no user to update."})
            }else{
            const isValidPassword = await bcrypt.compare(userCurrentPassword, user.userPassword)
            if(isValidPassword){
                const userInformation = {_id: ObjectId(userId)};
                const salt = await bcrypt.genSalt(10)
                const hashedUserNewPassword =  await bcrypt.hash(userNewPassword, salt)
                const updatedUserInformation = { $set: {userPassword: hashedUserNewPassword} };
                userCollection.updateOne(userInformation, updatedUserInformation, function(err, object) {
                    if (err){
                        logger.log({level: 'error', message: 'Internal error in user update password function'})
                        return res.status(500).send({errorMessage: "Something went wrong"})
                    } 
                    logger.log({level: 'info', message: 'User password has been updated successfully.'})
                    res.status(200).send({ updateSuccessMessage:"user password has been updated successfully."})
                });
            }else{
                logger.log({level: 'error', message: 'Current password is not matched wih the given current password.'})
                return res.status(401).send({ passwordNotMatchedError: "Current password is not matched wih the given current password."})
            }
            
            }
        })
    }
   
}

//update user information
const updateUserInformation = (req, res)=>{
    const userEmailParam = req.params.userEmail
    const {error, value}= updateUserInformationValidation(req.body)
    if(error) {
        logger.log({level: 'error', message: error.details[0].message})
        return res.status(400).send({message: error.details[0].message})
    }
    const userFullName = value.userFullName
    const userEmail = value.userEmail
    const userPassword = value.userPassword
    userCollection.findOne({userEmail: userEmailParam}, async (error, user)=>{
        if(error) {
            logger.log({level: 'error', message: 'Internal error in user update information function'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }
        if(user==null){
            logger.log({level: 'error', message: 'User is not available to update the information.'})
            return res.status(400).send({errorMessage: "User is not available to update the information."})
        }else{
            const userInformation = {userEmail: userEmailParam};
            const salt = await bcrypt.genSalt(10)
            const hashedUserNewPassword =  await bcrypt.hash(userPassword, salt)
            const updatedUserInformation = { $set: {userFullName: userFullName, userEmail: userEmail,userPassword: hashedUserNewPassword} };
            userCollection.updateOne(userInformation, updatedUserInformation, function(err, object) {
            if (err){
                logger.log({level: 'error', message: 'Internal error in user update information function'})
                return res.status(500).send({errorMessage: "Something went wrong"})
            } 
            logger.log({level: 'info', message: 'user information has been updated successfully.'})
            return res.status(200).send({ updateSuccessMessage:"user information has been updated successfully."})
            });
        }
    })

}

// get all users
const allUser = (req, res)=>{
    userCollection.find({}).toArray((err, result)=>{
        logger.log({level: 'info', message: 'Get all users'})
        res.status(200).send(result)
    })
}

// delete single user 
const deleteSingleUser = (req, res)=>{
    const userId = req.params.userId
    var deletedUserId = { _id: ObjectId(userId) };
    userCollection.deleteOne(deletedUserId,(err,data)=>{
        if(err) {
            logger.log({level: 'error', message: 'Internal error in user delete function.'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }
        logger.log({level: 'info', message: 'User has been deleted successfully'})
        res.status(200).send({
            message: `User has been deleted successfully`
        })
    })
}

// get all the info of requested user
const getUserProfile = (req,res)=>{
    const userEmail = req.user.userEmail
    userCollection.find({ userEmail: userEmail}).toArray((err, result)=>{
        let user = {}
        user.userFullName = result[0].userFullName
        user.userEmail = result[0].userEmail
        logger.log({level: 'info', message: 'Get all the info of requested user after login.'})
        res.status(200).send({user: user}) 
    })
}


//user refresh token
const userRefreshToken = async(req, res)=>{
    const refreshToken = req.header('refresh-token')
    if(!refreshToken) {
        logger.log({level: 'error', message: 'Access denied because token is not available.'})
        return res.send({ errorMessage: "Access Denied." })
    }
    const verified = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const userEmail = verified.userEmail
    const redisUserEmail = await redisClient.get(userEmail)
    if(redisUserEmail === null){
        logger.log({level: 'info', message: 'Login first before get refresh token'})
        return res.status(401).send({errorMessage: "Please login first"})
    }else{
        try {
            const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET,{expiresIn: process.env.JWT_EXPIRE_TIME})
            logger.log({level: 'info', message: 'Authentication and refresh token have been sent'})
            res.status(200).send({authToken: authToken, refreshToken: refreshToken})          
        } catch (error) {
            logger.log({level: 'error', message: 'Internal error in refresh token function.'})
            res.status(500).send({ userRefreshTokenErrorMessage: "Something went wrong."})
        }
    }
}

const userLogOut = (req, res)=>{
    const userEmail = req.user.userEmail
    redisClient.del(userEmail)
    logger.log({level: 'info', message: 'User has been logged out successfully.'})
    res.status(200).send({userLogoutMessage: "User has been logged out successfully."})
}

module.exports = {
    userRegistration,
    userLogin,
    allUser,
    deleteSingleUser,
    userVerifiedAccount,
    userUpdatePassword,
    mailForgetPasswordResetLink,
    userForgetPassword,
    updateUserInformation,
    getUserProfile,
    userRefreshToken,
    userLogOut
}

