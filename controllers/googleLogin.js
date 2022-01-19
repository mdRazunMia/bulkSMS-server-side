const database = require('../db/database')
const {OAuth2Client} = require('google-auth-library')
require('dotenv').config()

const clientAccount = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const  userCollection = database.collection("user")

const googleLogin = (req, res)=>{
    tokenId = req.body.tokenId
    
    clientAccount.verifyIdToken({idToken: tokenId, audience: "668987516685-cbeft0s2mojgf0el3aueqm3cfi6iospk.apps.googleusercontent.com"})
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
                    userCollection.insertOne(userInformation)
                    // const googleSuccessMessageAndInserted = "user has been logged in successfully."
                    res.send({googleSuccessMessageAndInserted:"user has been logged in successfully.", user: {userEmail: userEmail, userFullName: userFullName}})
                }else{
                    // console.log("User Already exist.")
                    const googleExistingSuccessMessage = "User Already exist."
                    res.send({googleExistingSuccessMessage: "User Already exist.", user: result})
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