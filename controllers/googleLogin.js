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
        if(verifiedEmail){
            // console.log("User is verified")
            userCollection.findOne({userEmail: userEmail}, (err, result)=>{
                if(err) throw err
                if(result==null){
                    const token = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
                    userCollection.insertOne(userInformation)
                    // const googleSuccessMessageAndInserted = "user has been logged in successfully."
                    res.header('auth-token').send({googleSuccessMessageAndInserted:"user has been logged in successfully.", user: {userEmail: userEmail, userFullName: userFullName}})
                }else{
                    const token = jwt.sign({_id: result._id},process.env.TOKEN_SECRET)
                    // console.log("User Already exist.")
                    const googleExistingSuccessMessage = "User Already exist."
                    res.header('auth-token').send({googleExistingSuccessMessage: "User Already exist.", user: result})
                }
            })

        }else{
            console.log("User is not verified")
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