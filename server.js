const db = require("./db/database");
// const redisInstance = require("./db/redis");

mongoDB();

//MongoDB code
function mongoDB() {
  db.ConnectAndGetInstance()
    .then((i) => {
      console.log("Successfully connected to MongoDb database");
      redisDb();
    })
    .catch((error) => {
      console.log("Could not connect to MongoDb database");
      console.log(error);
    });
}

//RedisDB code
function redisDb() {
  const redisClient = require("./db/redis");
  redisClient
    .redisConnectAndGetTheInstance()
    .then((res) => {
      console.log("Redis database connect successfully");
      expressServerApp();
    })
    .catch((error) => console.log("Redis database is not connected.", error));
}

//Express server code
function expressServerApp() {
  const express = require("express");
  const bodyParser = require("body-parser");
  const cors = require("cors");
  const cookieParser = require("cookie-parser");
  const session = require("express-session");
  const userRoute = require("./routes/userRoute.js");
  const campaignRoute = require("./routes/campaignRoute.js");
  const googleLoginRoute = require("./routes/googleLoginRoute.js");
  const linkedinLoginRoute = require("./routes/linkedinRoute");
  const apiKeyRoute = require("./routes/apiKeyRoute");
  const sendSMSRoute = require("./routes/sendSMSRoute");
  const passport = require("passport");
  const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
  const subUserRoute = require("./routes/subUserRoute");
  const app = express();
  const whitelist = [`${process.env.BASE_URL_FRONT_END}`];
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // callback(new error("Not allowed by CORS"));
        callback("Not allowed by CORS");
      }
    },
    credentials: true,
  };
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  const port = process.env.PORT || 5000;
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(
    session({
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: true },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use("/uploads", express.static("./uploads"));
  passport.serializeUser((profile, cb) => {
    cb(null, profile);
  });

  passport.deserializeUser((obj, cb) => {
    cb(null, obj);
  });

  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_SECRET_ID,
        callbackURL: `${process.env.BASE_URL_FRONT_END}/auth/linkedin/callback`,
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
          return done(null, profile);
        });
      }
    )
  );
  // const redisClient = redisInstance.getRedisClient();
  // acl = new acl(new acl.redisBackend({ client: redisClient }));
  // console.log(acl)
  // acl.allow("sub-admin", "showSubUsers", "view");

  app.use("/", userRoute);
  app.use("/api-key", apiKeyRoute);
  app.use("/auth", googleLoginRoute);
  app.use("/auth", linkedinLoginRoute);
  app.use("/campaign", campaignRoute);
  app.use("/subUser", subUserRoute);
  app.use("/API", sendSMSRoute);

  app.listen(port, () => {
    console.log("Dot Online Server is running on port", port);
  });
}
