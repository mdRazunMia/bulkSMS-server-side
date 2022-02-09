const database = require('../db/database')
const {OAuth2Client} = require('google-auth-library')
require('dotenv').config()
const jwt = require('jsonwebtoken')

const clientAccount = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const  userCollection = database.collection("user")

const googleLogin = (req, res)=>{
    tokenId = req.body.tokenId
    clientAccount.verifyIdToken({idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID})
    .then( response =>{
        console.log(response)
        const verifiedEmail = response.payload.email_verified
        const userFullName = response.payload.name
        const userEmail = response.payload.email
        const userInformation= {}
        userInformation.userFullName = userFullName
        userInformation.userEmail = userEmail
        userInformation.verified = verifiedEmail
        userInformation.medium="google"
        if(verifiedEmail){
            // console.log("User is verified")
            userCollection.findOne({userEmail: userEmail}, (err, result)=>{
                if(err) return res.send({errorMessage: "Something went wrong"})
                if(result==null){
                    const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
                    const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
                    userCollection.insertOne(userInformation)
                    // const googleSuccessMessageAndInserted = "user has been logged in successfully."
                    // res.header('auth-token').send({googleSuccessMessageAndInserted:"user has been logged in successfully.", user: {userEmail: userEmail, userFullName: userFullName}})
                    res.send({googleSuccessMessageAndInserted:"user has been logged in successfully.",authToken: authToken, refreshToken: refreshToken})
                }else{
                    const authToken = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET)
                    const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
                    // console.log("User Already exist.")
                    // const googleExistingSuccessMessage = "User Already exist."
                    res.header('auth-token').send({googleExistingSuccessMessage: "User Already exist.", authToken: authToken, refreshToken: refreshToken})
                }
            })

        }else{
            // console.log("User is not verified")
            res.send({ errorMessage: "User is not verified."})
        }
    //     const {email_verified, name, email} = response.payload
    //     console.log(response.payload)
    })
}

const googleLogOut = (req, res)=>{

}

module.exports = {
    googleLogin,
    googleLogOut
}