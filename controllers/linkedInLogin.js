const { MongoClient } = require('mongodb')
// const {OAuth2Client} = require('google-auth-library')
const ObjectId = require('mongodb').ObjectId
const passport = require('passport')
require('dotenv').config()

// const clientAccount = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect()
// console.log('successfully connected to the database')
const database = client.db("bulkSMS")
const  userCollection = database.collection("user")


const linkedinAuthRequest = ()=>{

}

const linkedInLogin = (req, res)=>{
    // res.json("welcome to the linkedin Controller")
    res.send("We are in LinkedInLogIn Controller")
}

const linkedInLogOut = ()=>{

}

module.exports = {
    linkedInLogin, 
    linkedInLogOut
}