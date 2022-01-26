const database = require('../db/database')
const nodeMailer = require('nodemailer')
const md5 = require('md5')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Str = require('@supercharge/strings')
const  userCollection = database.collection("user")
const {registerValidation,loginValidation} = require('../validations/validation')

const userRegistration = async (req, res)=>{
    const {error, value} = registerValidation(req.body) 
    if(error){
        res.send(error.details[0].message)
    }else{
        // res.send(value)
        const userFullName = value.userFullName
        const userEmail = value.userEmail
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(value.userPassword1, salt)
        const userPassword = hashedPassword
        userCollection.findOne({userEmail: userEmail}, (err, result)=>{
            if(err) throw err
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
                        user:process.env.EMAILID,
                        pass:process.env.EAILPASSWORD
                    }
                })
                const url = `http://localhost:3000/verified/${userEmail}/${userPassword}`
                const mailOption ={
                    from: 'test.sustneub@gmail.com',
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
                    
                           <h4>Need help?Ask at <a href="#">dotonline@global.com</a> or visit Our <a href="https://www.dotonlineglobal.com/">Help Center</a> </h4>
                          <div style="text-align:center; margin-top:20px;">
                            <h4>DotOnline,Inc.</h4>
                            <h4>Niketon, Gulshan, Road-6, Blcok-C, House 55</h4>
                          </div>
                           </div>
                    </body>
                    </html>
                    `
                }
                transporter.sendMail(mailOption, (err, data )=>{
                    if(err) throw err
                })
                res.send({ userRegisterSuccessMessage: "User has been registered successfully. A link has been sent to your gmail to verify your account."})
            }else{
                res.send({ message: "This email is already registered."})
            }
        })
    }


}

const userVerifiedAccount = (req, res)=>{
    const userEmail = req.params.userEmail
    console.log(userEmail)
    const userToken = req.params.userToken
    console.log(userToken)
    const userInformation = { userEmail: userEmail, userToken: userToken};
    const updatedUserInformation = { $set: {verified: true} };
    userCollection.updateOne(userInformation, updatedUserInformation, function(err, res) {
    if (err) throw err;
  });
  res.json({ verifiedMessage: "Account has been verified successfully."})
}

const userLogin = async (req, res)=>{
    const {error, value} = loginValidation(req.body)
    if(error){
        res.send(error.details[0].message)
    }else{
        const userEmail = value.userEmail
        const userPassword = value.userPassword
        userCollection.findOne({userEmail: userEmail}, (err, result)=>{
            if(err) throw err
            if(result != null){
                if(result.verified){
                    const validPassword = bcrypt.compare(result.userPassword, userPassword)
                    if(validPassword){
                        const token = jwt.sign({_id: result._id},process.env.TOKEN_SECRET, {
                            expiresIn: process.env.JWT_EXPIRE_TIME
                        })
                        console.log(token)
                        res.setHeader('auth-token', token)
                        const userInformation = { userEmail: userEmail};
                        const updatedUserInformation = { $set: {userToken: token} };
                         userCollection.updateOne(userInformation, updatedUserInformation, function(err, res) {
                            if (err) throw err;
                                console.log(res)
                        })
                        res.header('auth-token').send({
                            token: token
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


// const userForgetPassword = (req, res)=>{
//     const userEmail = req.body.userEmail
//     userCollection.findOne({userEmail: userEmail}, (err, user)=>{
//         if(err) throw err
//         if(user==null){
//             const userEmailError = "This email is not exist. Please register first"
//             res.json(userEmailError)
//         }else{

//             const transporter = nodeMailer.createTransport({
//                 service: "gmail",
//                 auth:{
//                     user:process.env.EMAILID,
//                     pass:process.env.EAILPASSWORD
//                 }
//             })

//             const userPassword = user.userPassword
//             const mailOption ={
//                 from: 'test.sustneub@gmail.com',
//                 to: userEmail,
//                 subject: 'Please check your password',
//                 html: `Your new password is: ${userPassword}`
//             }
//             transporter.sendMail(mailOption, (err, data )=>{
//                 if(err) throw err
//             })
//             userPasswordRetrieveMessage="Your forget password has been sent to your email account. Please check the email."
//            res.json(userPasswordRetrieveMessage)

//         }
//     })
// }


const mailResetLink = (req, res)=>{
    const userEmail = req.body.userEmail
    console.log(userEmail)
    userCollection.findOne({userEmail: userEmail},(err, user)=>{
        if(err) throw err
        if(user==null){
            res.send({resetPasswordErrorMessage: "This email is not registered. Please registered this email first."})
        }else{
            const transporter = nodeMailer.createTransport({
                service: "gmail",
                auth:{
                    user:process.env.EMAILID,
                    pass:process.env.EAILPASSWORD
                }
            })
            const url = `http://localhost:3000/resetPassword/userEmail=${userEmail}`
            const mailOption ={
                from: 'test.sustneub@gmail.com',
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
                
                       <h4>Need help?Ask at <a href="#">dotonline@global.com</a> or visit Our <a href="https://www.dotonlineglobal.com/">Help Center</a> </h4>
                      <div style="text-align:center; margin-top:20px;">
                        <h4>DotOnline,Inc.</h4>
                        <h4>Niketon, Gulshan, Road-6, Blcok-C, House 55</h4>
                      </div>
                       </div>
                </body>
                </html>
                `
            }
            transporter.sendMail(mailOption, (err, data )=>{
                if(err) throw err
            })
            res.send({ resetPasswordMessage: "A link has been sent to your gmail to reset your password."})
        }
    })

}

const userResetPassword = (req, res)=>{
    const {error, value} = userResetPasswordValidation(req.body)
    if(error){
        res.send(error.details[0].message)
    }else{
        const userEmail = value.userEmail
        const userNewPassword = value.userPassword1
        userCollection.findOne({userEmail: userEmail},(err, user)=>{
            if(err) throw err
            if(user==null){
                // const userNotExistError = "There is no user to update."
                res.send({message: "There is no user to update."})
            }else{
            const userInformation = {userEmail: userEmail};
            const salt = bcrypt.genSalt(10)
            const hashedUserNewPassword =  bcrypt.hash(userNewPassword, salt)
            const updatedUserInformation = { $set: {userPassword: hashedUserNewPassword} };
            userCollection.updateOne(userInformation, updatedUserInformation, function(err, objecet) {
                 if (err) throw err
                 res.send({ updateSuccessMessage:"user password has been updated successfully."})
             });
            }
        })
    }
   
}




const allUser = (req, res)=>{
    userCollection.find({}).toArray((err, result)=>{
        res.json(result)
    })
}


const deleteSinglelUser = (req, res)=>{
    const userId = req.params.userId
    console.log(userId)
    var deletedUserId = { _id: ObjectId(userId) };
    userCollection.deleteOne(deletedUserId,(err,data)=>{
        if(err) throw err
        res.send({
            message: `user id ${userId} has been deleted successfully`
        })
    })
}

//new task
const getUserProfile = (req,res)=>{
    const token = req.header('auth-token')
    console.log(req.user)
    userCollection.find({ userToken: token}).toArray((err, result)=>{
        let user = {}
        user.userFullName = result[0].userFullName
        user.userEmail = result[0].userEmail
        res.send(user) 
    })
}

module.exports = {
    userRegistration,
    userLogin,
    allUser,
    deleteSinglelUser,
    userVerifiedAccount,
    // userForgetPassword,
    userResetPassword,
    mailResetLink,
    getUserProfile
}







