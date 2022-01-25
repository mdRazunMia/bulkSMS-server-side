const { MongoClient } = require('mongodb')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId


//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, maxPoolSize: 10 })
client.connect()
//console.log('successfully connected to the database')
const database = client.db("bulkSMS")

module.exports = database