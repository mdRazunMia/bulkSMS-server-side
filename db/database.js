const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
module.exports = (function () {
  let dbConnectionInstance;
  let bulkSmsDb;

  function ConnectAndGetInstance() {
    return new Promise(function (resolve, reject) {
      if (dbConnectionInstance) {
        console.log("Using already created db connection instance");
        return resolve(dbConnectionInstance);
      }

      const options = {
        useNewUrlParser: true,
      };
      const uri = `${process.env.MONGO_BASE_URL}${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;
      const dbName = process.env.MONGO_DB_NAME;
      MongoClient.connect(uri, options, function (err, client) {
        if (err) {
          return reject(err);
        }

        dbConnectionInstance = client;
        bulkSmsDb = client.db(dbName);

        console.log("Using newly created db connection instance");
        return resolve(dbConnectionInstance);
      });
    });
  }

  function getBulkSmsDb() {
    if (!bulkSmsDb) {
      throw new Error("bulkSmsDb object is not initialized!");
    }
    return bulkSmsDb;
  }

  function GetCollection() {
    if (!bulkSmsDb) {
      throw new Error("bulkSmsDb object is not initialized!");
    }

    function CampaignCollection() {
      return bulkSmsDb.collection("campaign_details");
    }

    function SmsCollection() {
      return bulkSmsDb.collection("sms_details");
    }

    function userCollection() {
      return bulkSmsDb.collection("user");
    }
    function subUserCollection() {
      return bulkSmsDb.collection("sub-user");
    }

    function apiKeyCollection() {
      return bulkSmsDb.collection("api_keys");
    }

    return {
      CampaignCollection,
      SmsCollection,
      userCollection,
      subUserCollection,
      apiKeyCollection,
    };
  }

  return {
    ConnectAndGetInstance,
    getBulkSmsDb,
    GetCollection,
  };
})();
