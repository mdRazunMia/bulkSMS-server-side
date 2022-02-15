const database = require('../db/database')
const {OAuth2Client} = require('google-auth-library')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const redisClient  = require('../db/redis')

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
                if(err) return res.status(500).send({errorMessage: "Something went wrong"})
                if(result==null){
                    const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
                    const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
                    userCollection.insertOne(userInformation)
                    redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
                        if(err) return res.status(500).send({errorMessage:"Something went wrong."})
                    })
                    res.status(200).send({googleSuccessMessageAndInserted:"user has been logged in successfully.",authToken: authToken, refreshToken: refreshToken})
                }else{
                    const authToken = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET)
                    const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
                    redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
                        if(err) return res.status(500).send({errorMessage:"Something went wrong."})
                    })
                    res.status(200).send({googleExistingSuccessMessage: "User Already exist.", authToken: authToken, refreshToken: refreshToken})
                }
            })

        }else{
            res.status(400).send({ errorMessage: "User google account is not verified."})
        }
    })
}


module.exports = {
    googleLogin
}