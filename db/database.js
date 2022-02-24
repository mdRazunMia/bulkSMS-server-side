const { MongoClient } = require('mongodb')


//database uri
const uri = `${process.env.MONGO_BASE_URL}${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net`;///${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, maxPoolSize: 10 })
client.connect(((err, client)=>{
    if(err){
        throw err
    }
    console.log('successfully connected to the MongoDB database')
})
)
const database = client.db("bulkSMS")

module.exports = database



// const { MongoClient } = require('mongodb');

// require('dotenv').config()

// const DbConnection = function () {
//     let dbInstance = null;

//     // All mongo db collections
//     const collections = {
//         campaignCollection: null,
//         smsCollection: null,
//         userCollection: null
//         // Add more if needed // OR CREATE Functions
//     };

//     // function CampaignCollection(){
//     //     return dbInstance.collection('campain');
//     // }

//     async function ConnectMongoDb() {
//         // TODO GET FROM ENV
//         const uri = `${process.env.MONGO_BASE_URL}${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net`;
//         // console.log(uri);
//         const mongoDbClient = new MongoClient(uri);

//         mongoDbClient.connect(function (err, database) {
//             if (err !== undefined) {
//                 console.log(err);
//             }else{
//                 dbInstance = database.db(process.env.MONGO_DB_NAME); // TODO GET FROM ENV
//                 console.log('inside the function')
//                 collections.campaignCollection = dbInstance.collection('campaign_details');
//                 // collections.smsCollection = dbInstance.collection('smsCollection');
//                 collections.userCollection = dbInstance.collection('user')
//                 // Add more collections as needed
//             }
//         });

//         if (dbInstance == null) {
//             return Promise.reject('COULD NOT CONNECT TO MONGODB');
//         }
//         return dbInstance;
//     }

//     // Returns DB instance
//     async function GetDbInstance() {
//         try {
//             if (dbInstance != null) {
//                 console.log(`db connection is already alive`);
//                 return dbInstance;
//             } else {
//                 console.log(`getting new db connection`);
//                 dbInstance = await ConnectMongoDb();
//                 return dbInstance;
//             }
//         } catch (e) {
//             return Promise.reject(e);
//         }
//     }

//     return {
//         GetDbInstance: GetDbInstance,
//         collections: collections
//     };
// };

// module.exports = DbConnection();

