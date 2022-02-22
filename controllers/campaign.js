const database = require('../db/database')
const logger = require('../logger/logger')
const  campaignCollection = database.collection("campaign_details")

const createCampaign = (req, res)=>{
    const campaignInformation = req.body
    let verified = false
    campaignCollection.insertOne(campaignInformation, (err, response)=>{
        if(err){
            logger.log({level: 'error', message: 'Internal error for create campaign in database. | code: 22-2'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        } 
        if(response.acknowledged){
            verified = true
        }
    })
    logger.log({level: 'info', message: 'Campaign has been created successfully. | code: 22-3'})
   res.status(201).send({ message: "Campaign has been created successfully."})
}

//show campaign list
const showAllCampaign = (req, res)=>{
    campaignCollection.find({}).toArray((err, result)=>{
        if(err) {
            logger.log({level: 'error', message: 'Internal error for create campaign in database. | code: 23-1'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }
        logger.log({level: 'info', message: 'Send all the campaign information. | code: 23-2'})
        res.status(200).send({
            campaigns: result
        })
    })
}
//delete a single campaign
const deleteCampaign = (req, res)=>{
    const campaignId = req.params.campaignId
    var deletedCampaignId = { _id: ObjectId(campaignId) };
    campaignCollection.deleteOne(deletedCampaignId,(err,data)=>{
        if(err) {
            logger.log({level: 'error', message: 'Internal error for create campaign in database. | code: 24-1'})
            return res.status(500).send({errorMessage: "Something went wrong"})
        }
        logger.log({level: 'info', message: 'Campaign has been created successfully. | code: 24-2'})
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