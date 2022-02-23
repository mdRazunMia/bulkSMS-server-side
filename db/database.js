const { MongoClient } = require('mongodb')

//database uri
const uri = `${process.env.MONGO_BASE_URL}${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;
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

