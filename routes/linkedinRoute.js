const express = require("express");
const router = express.Router();
const passport = require('passport')
const database = require('../db/database')
const jwt = require('jsonwebtoken');
// const auth = require("../validations/verified");
require('dotenv').config()
const redisClient  = require('../db/redis')
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
      if(err) return res.status(500).send({errorMessage: "Something went wrong"})
      if(result==null){
        const authToken = jwt.sign({userEmail: userEmail},process.env.TOKEN_SECRET)
        const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
        userCollection.insertOne(linkedInUser)
        redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
          if(err) return res.status5(500).send({errorMessage:"Something went wrong."})
          console.log(`reply from login redis: ${reply}`)
      })
        res.status(200).send({linkedInSuccessMessageAndInserted:"User has been logged in successfully.",authToken: authToken, refreshToken: refreshToken})
      }else{
          const authToken = jwt.sign({userEmail: result.userEmail},process.env.TOKEN_SECRET)
          const refreshToken = jwt.sign({userEmail: userEmail}, process.env.REFRESH_TOKEN_SECRET)
          redisClient.set(userEmail, refreshToken,{ EX: 365*24*60*60} , (err, reply)=>{
            if(err) return res.status(500).send({errorMessage:"Something went wrong."})
            console.log(`reply from login redis: ${reply}`)
        })
          res.status(200).send({linkedInExistingSuccessMessage: "User Already exist.", authToken: authToken, refreshToken: refreshToken})
      }
  }
  )
  }
  );


module.exports = router