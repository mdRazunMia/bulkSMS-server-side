const database = require('../db/database')

const  campaignCollection = database.collection("campaign_details")

const createCampaign = (req, res)=>{
    const campaignInformation = req.body
    //res.json(campaignInformation)
    let verified = false
    campaignCollection.insertOne(campaignInformation, (err, response)=>{
        if(err) return res.status(500).send({errorMessage: "Something went wrong"})
        if(response.acknowledged){
            // console.log("Campaign has been created successfully.")
            verified = true
        }
    })
    
   res.status(201).send({ message: "Campaign has been created successfully."})
}

const showAllCampaign = (req, res)=>{
    campaignCollection.find({}).toArray((err, result)=>{
        if(err) return res.status(500).send({errorMessage: "Something went wrong"})
        // res.json(result)
        res.status(200).send({
            campaigns: result
        })
    })
}


const deleteCampaign = (req, res)=>{
    const campaignId = req.params.campaignId
    console.log(campaignId)
    var deletedCampaignId = { _id: ObjectId(campaignId) };
    campaignCollection.deleteOne(deletedCampaignId,(err,data)=>{
        if(err) return res.status(500).send({errorMessage: "Something went wrong"})
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