const express = require("express");
const router = express.Router();
const passport = require('passport')
const { MongoClient } = require('mongodb')
require('dotenv').config()
//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect()
// console.log('successfully connected to the database')
const database = client.db("bulkSMS")
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
      if(err) throw err
      if(result==null){
          userCollection.insertOne(linkedInUser)
          // const googleSuccessMessageAndInserted = "user has been logged in successfully."
          console.log("user has been logged in successfully")
          res.send({linkedInSuccessMessageAndInserted:"User has been logged in successfully.", user: {userEmail: userEmail, userFullName: userFullName}})
      }else{
          // console.log("User Already exist.")
          console.log("User already exist")
          const googleExistingSuccessMessage = "User Already exist."
          res.send({googleExistingSuccessMessage: "User Already exist.", user: result})
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