const database = require('../db/database')
const nodeMailer = require('nodemailer')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Str = require('@supercharge/strings')
const  userCollection = database.collection("user")
const {registerValidation,loginValidation} = require('../validations/validation')


//user registration
const userRegistration = async (req, res)=>{
    const {error, value} = registerValidation(req.body) 
    if(error){
        res.send(error.details[0].message)
    }else{
        // res.send(value)
        const userFullName = value.userFullName
        const userEmail = value.userEmail
        const salt = await bcrypt.genSalt(10)
        const userPassword = await bcrypt.hash(value.userPassword1, salt)
        userCollection.findOne({userEmail: userEmail}, (err, result)=>{
            if(err) return res.send({errorMessage: "Something went wrong"})
            if(result == null){
                const userInformation = {}
                userInformation.userFullName = userFullName
                userInformation.userEmail = userEmail
                userInformation.userPassword = userPassword
                const userRandomToken = Str.random(50)
                userInformation.userToken = userRandomToken
                console.log(`user token: ${userRandomToken}`)
                userInformation.verified = false
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
                    // from: 'test.sustneub@gmail.com',
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
                    if(err) return res.send({errorMessage: "Something went wrong when sent the mail."})
                })
                res.send({ userRegisterSuccessMessage: "User has been registered successfully. A link has been sent to your gmail to verify your account."})
            }else{
                res.send({ message: "This email is already registered."})
            }
        })
    }


}


//verify user account
const userVerifiedAccount = (req, res)=>{
    const userEmail = req.params.userEmail
    console.log(userEmail)
    const userToken = req.params.userRandomToken
    console.log(userToken)
    const userInformation = { userEmail: userEmail, userToken: userToken};
    const updatedUserInformation = { $set: {verified: true} };
    userCollection.updateOne(userInformation, updatedUserInformation, function(err, res) {
    if (err) return res.send({errorMessage: "Something went wrong"})
  });
  res.json({ verifiedMessage: "Account has been verified successfully."})
}


//user login
const userLogin = async (req, res)=>{
    const {error, value} = loginValidation(req.body)
    if(error){
        res.send(error.details[0].message)
    }else{
        const userEmail = value.userEmail
        const userPassword = value.userPassword
        userCollection.findOne({userEmail: userEmail}, async (err, result)=>{
            if(err) return res.send({errorMessage: "Something went wrong"})
            if(result != null){
                if(result.verified){
                    const validPassword = await bcrypt.compare(userPassword,result.userPassword)
                    console.log(validPassword)
                    if(validPassword){
                        const token = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET, {
                            expiresIn: process.env.JWT_EXPIRE_TIME
                        })
                        const refreshToken = jwt.sign({userEmail: result.userEmail}, process.env.REFRESH_TOKEN_SECRET,{
                            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME
                        })
                        res.header('auth-token').send({
                            authToken: token,
                            refreshToken: refreshToken
                        })
                    }
                }else{
                    res.send({ message: "Please Verify your email first."})
                }
            }else{
                 res.send({message: "Email/Password is incorrect or registered first"})
            }
            
        })
    }
    
}


// send reset mail
const mailResetLink = (req, res)=>{
    const userEmail = req.body.userEmail
    console.log(userEmail)
    userCollection.findOne({userEmail: userEmail},(err, user)=>{
        if(err) return res.send({errorMessage: "Something went wrong"})
        if(user==null){
            res.send({resetPasswordErrorMessage: "This email is not registered. Please registered this email first."})
        }else{
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
                // html: `Click <a href = '${url}'>here</a> to change your password.`
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
                if(err) return res.send({errorMessage: "Something went wrong"})
            })
            res.send({ resetPasswordMessage: "A link has been sent to your gmail to reset your password."})
        }
    })

}


// reset user password
const userUpdatePassword = (req, res)=>{
    const {error, value} = userUpdatePasswordValidation(req.body)
    if(error){
        res.send(error.details[0].message)
    }else{
        const userEmail = value.userEmail
        const userNewPassword = value.userPassword1
        userCollection.findOne({userEmail: userEmail},(err, user)=>{
            if(err) return res.send({errorMessage: "Something went wrong"})
            if(user==null){
                // const userNotExistError = "There is no user to update."
                res.send({message: "There is no user to update."})
            }else{
            const userInformation = {userEmail: userEmail};
            const salt = bcrypt.genSalt(10)
            const hashedUserNewPassword =  bcrypt.hash(userNewPassword, salt)
            const updatedUserInformation = { $set: {userPassword: hashedUserNewPassword} };
            userCollection.updateOne(userInformation, updatedUserInformation, function(err, object) {
                 if (err) return res.send({errorMessage: "Something went wrong"})
                 res.send({ updateSuccessMessage:"user password has been updated successfully."})
             });
            }
        })
    }
   
}



// get all users
const allUser = (req, res)=>{
    userCollection.find({}).toArray((err, result)=>{
        res.json(result)
    })
}

// delete single user 
const deleteSingleUser = (req, res)=>{
    const userId = req.params.userId
    console.log(userId)
    var deletedUserId = { _id: ObjectId(userId) };
    userCollection.deleteOne(deletedUserId,(err,data)=>{
        if(err) return res.send({errorMessage: "Something went wrong"})
        res.send({
            message: `user id ${userId} has been deleted successfully`
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
        res.send({user: user}) 
    })
}


//user refresh token
const userRefreshToken = (req, res)=>{
    const refreshToken = req.header('refresh-token')
    if(!refreshToken) return res.send({ errorMessage: "Access Denied." })
    const verified = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const userEmail = verified.userEmail
    try {
        const verified = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const token = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET,{
            expiresIn: process.env.JWT_EXPIRE_TIME
        })
        console.log(`token: ${token}, refreshToken: ${refreshToken}`)
        res.send({
            authToken: token,
            refreshToken: refreshToken
        })
               
    } catch (error) {
        res.send({ errorMessage: "Invalid Token or time is expired"})
    }
    
}

const userLogOut = (req, res)=>{
    
}

module.exports = {
    userRegistration,
    userLogin,
    allUser,
    deleteSingleUser,
    userVerifiedAccount,
    userUpdatePassword,
    mailResetLink,
    getUserProfile,
    userRefreshToken
}







