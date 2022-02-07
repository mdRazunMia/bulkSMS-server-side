const express = require("express");
const router = express.Router();
const passport = require('passport')
const database = require('../db/database')
const jwt = require('jsonwebtoken');
const auth = require("../validations/verified");
require('dotenv').config()

const  userCollection = database.collection("user")

router.get('/linkedin',  passport.authenticate('linkedin', {
    scope: ['r_emailaddress', 'r_liteprofile'],
}))

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/auth/linkedInError' }),
  function(req, res) {
    // console.log(req.user.displayName)
    const userFullName = req.user.displayName
    const linkedInUserEmail = req.user.emails[0]
    const userEmail = linkedInUserEmail.value
    // console.log(userEmail)
    const linkedInUser = {
      "userFullName":userFullName,
      "userEmail": userEmail,
      "verified": true
    }
    userCollection.findOne({userEmail: userEmail}, (err, result)=>{
      if(err) return res.send({errorMessage: "Something went wrong"})
      if(result==null){
        const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
        const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
          userCollection.insertOne(linkedInUser)
          // const googleSuccessMessageAndInserted = "user has been logged in successfully."
          // console.log("user has been logged in successfully")
          // res.header('auth-token').send({linkedInSuccessMessageAndInserted:"User has been logged in successfully.", user: {userEmail: userEmail, userFullName: userFullName}})
          res.send({linkedInSuccessMessageAndInserted:"User has been logged in successfully.",authToken: authToken, refreshToken: refreshToken})
      }else{
          const authToken = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET)
          const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
          // console.log("User Already exist.")
          // console.log("User already exist")
          // const googleExistingSuccessMessage = "User Already exist."
          // res.header('auth-token').send({linkedInExistingSuccessMessage: "User Already exist.", user: result})
          res.send({linkedInExistingSuccessMessage: "User Already exist.", authToken: authToken, refreshToken: refreshToken})
      }
  }
  )
  }
  );

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next()
}

module.exports = router