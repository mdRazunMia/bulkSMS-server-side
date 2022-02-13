const express = require('express');
require('dotenv').config();
var bodyParser = require('body-parser')
const cors = require('cors');
var cookieParser = require('cookie-parser');
var session = require('express-session');
const userRoute = require("./routes/userRoute.js")
const campaignRoute = require("./routes/campaignRoute.js")
const googleLoginRoute = require("./routes/googleLoginRoute.js")
const linkedinLoginRoute = require('./routes/linkedinRoute'); 
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const subUserRoute = require('./routes/subUserRoute')

//connect databases
require('./db/redis')
require('./db/database')

// const createClient = require('./db/database')
// createClient.createClient()


const app = express();



const whitelist = [`${process.env.BASE_URL}`]
const corsOptions = {
  origin: function(origin, callback){
    if(!origin || whitelist.indexOf(origin) !==-1){
      callback(null, true)
    }else{
      callback(new error("Not allowed by CORS"))
    }
  },
  credentials: true,
}
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const port = process.env.PORT || 5000;
app.use(cookieParser())
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((profile, cb)=>{
    cb(null, profile)
})

passport.deserializeUser((obj, cb)=>{
    cb(null, obj)
})

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_SECRET_ID,
  callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
  scope: ['r_emailaddress', 'r_liteprofile'],
}, function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}));


app.use('/', userRoute);
app.use('/auth',googleLoginRoute)
app.use('/auth', linkedinLoginRoute)
app.use('/campaign',campaignRoute)
app.use('/subUser',subUserRoute)


app.listen(port, () => {
    console.log('Dot Online Server is running on port', port);
});