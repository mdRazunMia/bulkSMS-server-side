const express = require("express");
const router = express.Router();
const campaignController = require('../controllers/campaign.js')
//CAMPAIGN ROUTE
router.post('/create',campaignController.createCampaign)
router.get('/show', campaignController.showAllCampaign)
router.delete('/delete/:campaignId', campaignController.deleteCampaign)

module.exports = router