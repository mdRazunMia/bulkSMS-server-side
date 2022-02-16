const database = require('../db/database')
const logger = require('../logger/logger')
const  campaignCollection = database.collection("campaign_details")

const createCampaign = (req, res)=>{
    const campaignInformation = req.body
    let verified = false
    campaignCollection.insertOne(campaignInformation, (err, response)=>{
        if(err){
            logger.log({level: 'error', message: 'Internal error for create campaign in database'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        } 
        if(response.acknowledged){
            verified = true
        }
    })
    logger.log({level: 'info', message: 'Campaign has been created successfully.'})
   res.status(201).send({ message: "Campaign has been created successfully."})
}

const showAllCampaign = (req, res)=>{
    campaignCollection.find({}).toArray((err, result)=>{
        if(err) {
            logger.log({level: 'error', message: 'Internal error for create campaign in database'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }
        logger.log({level: 'info', message: 'Send all the campaign information.'})
        res.status(200).send({
            campaigns: result
        })
    })
}

const deleteCampaign = (req, res)=>{
    const campaignId = req.params.campaignId
    var deletedCampaignId = { _id: ObjectId(campaignId) };
    campaignCollection.deleteOne(deletedCampaignId,(err,data)=>{
        if(err) {
            logger.log({level: 'error', message: 'Internal error for create campaign in database'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }
        logger.log({level: 'info', message: 'Campaign has been created successfully.'})
        res.status(200).send({
            message: `Campaign id ${campaignId} has been deleted successfully`
        })
    })
}

module.exports = {
    createCampaign,
    showAllCampaign,
    deleteCampaign
}