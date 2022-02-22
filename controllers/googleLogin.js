const database = require('../db/database')
const {OAuth2Client} = require('google-auth-library')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const redisClient  = require('../db/redis')
const logger = require('../logger/logger')

const clientAccount = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const  userCollection = database.collection("user")

const googleLogin = (req, res)=>{
    tokenId = req.body.tokenId
    clientAccount.verifyIdToken({idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID})
    .then( response =>{
        const verifiedEmail = response.payload.email_verified
        const userFullName = response.payload.name
        const userEmail = response.payload.email
        const userInformation= {}
        userInformation.userFullName = userFullName
        userInformation.userEmail = userEmail
        userInformation.verified = verifiedEmail
        userInformation.medium="google"
        if(verifiedEmail){
            userCollection.findOne({userEmail: userEmail}, (err, result)=>{
                if(err){
                    logger.log({level: 'error', message: 'Internal error for login user in database'})
                    return res.status(500).send({errorMessage: "Something went wrong"})
                } 
                if(result==null){
                    const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
                    const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
                    userCollection.insertOne(userInformation)
                    redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
                        if(err){
                            logger.log({level: 'error', message: 'Internal error for login user in database. | code: 13-1'})
                            return res.status(500).send({errorMessage:"Something went wrong."})
                        } 
                    })
                    logger.log({level: 'info', message: 'User has been logged in successfully by using google account. | code: 13-2'})
                    res.status(200).send({googleSuccessMessageAndInserted:"user has been logged in successfully.",authToken: authToken, refreshToken: refreshToken})
                }else{
                    const authToken = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET)
                    const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
                    redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
                        if(err){
                            logger.log({level: 'error', message: 'Internal error for login user in database for google login. | code: 13-3'})
                            return res.status(500).send({errorMessage:"Something went wrong."})
                        } 
                    })
                    logger.log({level: 'warn', message: 'User Already exist in this email. | code: 13-4'})
                    res.status(200).send({googleExistingSuccessMessage: "User Already exist.", authToken: authToken, refreshToken: refreshToken})
                }
            })

        }else{
            logger.log({level: 'warn', message: 'User google account is not verified. | code: 13-5'})
            res.status(400).send({ errorMessage: "User google account is not verified."})
        }
    })
}


module.exports = {
    googleLogin
}