const express = require("express")
const { MongoClient } = require('mongodb')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const nodeMailer = require('nodemailer')
const md5 = require('md5')
require('dotenv').config()



//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect()
console.log('successfully connected to the database')
const database = client.db("bulkSMS")
const  userCollection = database.collection("user")

const userRegistration = async (req, res)=>{
    let userPassword = ""
    const userFullName = req.body.userFullName
    const userEmail = req.body.userEmail
    const userPassword1 = req.body.userPassword1
    const userPassword2 = req.body.userPassword2
    let userRegisterSuccessMessage = " "
    let userRegisterExistingMessage = " "
    const messages = {}
    if(!userFullName || !userEmail || !userPassword1 || !userPassword2){
        //const inputFieldInvalidMessage= "Please fill in all fields."
        //return res.json(inputFieldInvalidMessage) ; 
        return res.send({ message: "Please fill in all fields."})
    }else if(userPassword1.length < 8 || userPassword2.length <8){
    //    const passwordLengthError= "Password must be greater than or equal to 8.";
    //    return res.json(passwordLengthError)
        return res.send({ message: "Password must be greater than or equal to 8."})
    }else if(userPassword1 !== userPassword2){
        // const userPasswordNotMatched= "Password and Confirm Password are not matched.";
        // return  res.json(userPasswordNotMatched);
        return res.send({ message: "Password and Confirm Password are not matched."})
    }else{
        userPassword = md5(userPassword1)
    }
    userCollection.findOne({userEmail: userEmail}, (err, result)=>{
        if(err) throw err
        if(result == null){
            const userInformation = {}
            userInformation.userFullName = userFullName
            userInformation.userEmail = userEmail
            userInformation.userPassword = userPassword
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
        //     userRegisterSuccessMessage="User has been registered successfully. A link has been sent to your gmail to verify your account."
        //    res.json(userRegisterSuccessMessage)
            res.send({ userRegisterSuccessMessage: "User has been registered successfully. A link has been sent to your gmail to verify your account."})
        }else{
            res.send({ message: "This email is already registered."})
            // userRegisterExistingMessage="This email is already registered."
            // res.json(userRegisterExistingMessage)
        }
    })
}

const userVerifiedAccount = (req, res)=>{
    const userEmail = req.params.userEmail
    // console.log(userEmail)
    const userPassword = req.params.userPassword
    // console.log(userPassword)
    const userInformation = { userEmail: userEmail, userPassword: userPassword };
    const updatedUserInformation = { $set: {verified: true} };
    userCollection.updateOne(userInformation, updatedUserInformation, function(err, res) {
    if (err) throw err;
    // console.log(res)
  });
  const verifiedMessage = "Account has been verified successfully."
//   res.json({ verifiedMessage: "Account has been verified successfully."})
  res.json({verifiedMessage})
}

const userLogin = async (req, res)=>{
    const userEmail = req.body.userEmail
    const userPassword = md5(req.body.userPassword)
    // console.log(userEmail)
    // console.log(userPassword)
    if(!userEmail || !userPassword){
        const inputFieldInvalidMessage= "Please fill in all fields."
        return res.json(inputFieldInvalidMessage) ; 
    }else if(userPassword.length < 8){
       const passwordLengthError= "Password must be greater than or equal to 8.";
        return res.json(passwordLengthError)
    }
    userCollection.findOne({userEmail: userEmail, userPassword: userPassword}, (err, result)=>{
        if(err) throw err
        if(result != null){
            if(result.verified){
                req.session.userFullName = result.userFullName
                req.session.userEmail = result.userEmail
                // console.log(`user session data: ${req.session.userFullName}  ${req.session.userEmail}`)
                res.send({ loginSuccessMessage: "User has been logged in successfully.", user: result})
            }else{
                res.send({ message: "Please Verify your email first.",user: result})
            }
        }else{
             res.send({message: "Email/Password is incorrect or registered first",user: result})
        }
        
    })
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
        //     userRegisterSuccessMessage="User has been registered successfully. A link has been sent to your gmail to verify your account."
        //    res.json(userRegisterSuccessMessage)
            res.send({ resetPasswordMessage: "A link has been sent to your gmail to reset your password."})
        }
    })

}

const userResetPassword = (req, res)=>{
    const userEmail = req.query.userEmail
    console.log(userEmail)
    const userPassword1 = req.body.userPassword1
    const userPassword2 = req.body.userPassword2
    if(!userPassword1 || !userPassword2){
        // const inputFieldInvalidMessage= "Please fill in all fields."
        return res.send({message: "Please fill in all fields."}) ; 
    }else if(userPassword1.length < 8 || userPassword2.length <8){
    //    const passwordLengthError= "Password must be greater than or equal to 8.";
        return res.send({message: "Password must be greater than or equal to 8."})
    }else if(userPassword1 !== userPassword2){
        // const userPasswordNotMatched= "Password and Confirm Password are not matched.";
        return  res.send({message:"Password and Confirm Password are not matched."});
    }
    const userPassword = md5(userPassword1)
    userCollection.findOne({userEmail: userEmail},(err, user)=>{
        if(err) throw err
        if(user==null){
            // const userNotExistError = "There is no user to update."
            res.send({message: "There is no user to update."})
        }else{
        const userInformation = {userEmail: userEmail};
        const updatedUserInformation = { $set: {userPassword: userPassword} };
        userCollection.updateOne(userInformation, updatedUserInformation, function(err, objecet) {
             if (err) throw err
             res.send({ updateSuccessMessage:"user password has been updated successfully."})
         });
        }
    })
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


const validateEmail = (userEmail)=>{
    var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/
    emailRegex.test(userEmail)
}

module.exports = {
    userRegistration,
    userLogin,
    allUser,
    deleteSinglelUser,
    userVerifiedAccount,
    // userForgetPassword,
    userResetPassword,
    mailResetLink
}







