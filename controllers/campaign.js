const express = require("express")
const { MongoClient } = require('mongodb')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId


//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect()
//console.log('successfully connected to the database')
const database = client.db("bulkSMS")
const  campaignCollection = database.collection("campaign_details")

const createCampaign = (req, res)=>{
    const campaignInformation = req.body
    //res.json(campaignInformation)
    let verified = false
    campaignCollection.insertOne(campaignInformation, (err, response)=>{
        if(err) throw err
        if(response.acknowledged){
            // console.log("Campaign has been created successfully.")
            verified = true
        }
    })
    
   res.send({ message: "Campaign has been created successfully."})
}

const showAllCampaign = (req, res)=>{
    campaignCollection.find({}).toArray((err, result)=>{
        if(err) throw err
        res.json(result)
    })
}


const deleteCampaign = (req, res)=>{
    const campaignId = req.params.campaignId
    console.log(campaignId)
    var deletedCampaignId = { _id: ObjectId(campaignId) };
    campaignCollection.deleteOne(deletedCampaignId,(err,data)=>{
        if(err) throw err
        res.send({
            message: `Campaign id ${campaignId} has been deleted successfully`
        })
    })
}

module.exports = {
    createCampaign,
    showAllCampaign,
    deleteCampaign
}