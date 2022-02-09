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
    const linkedInUser = {
      "userFullName":userFullName,
      "userEmail": userEmail,
      "verified": true,
      "medium": "linkedIn"

    }
    userCollection.findOne({userEmail: userEmail}, (err, result)=>{
      if(err) return res.send({errorMessage: "Something went wrong"})
      if(result==null){
        const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
        const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
        userCollection.insertOne(linkedInUser)
        res.send({linkedInSuccessMessageAndInserted:"User has been logged in successfully.",authToken: authToken, refreshToken: refreshToken})
      }else{
          const authToken = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET)
          const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
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