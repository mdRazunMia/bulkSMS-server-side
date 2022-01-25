const express = require("express");
const router = express.Router();
const campaignController = require('../controllers/campaign.js')
const auth = require('../validations/verified')
//CAMPAIGN ROUTE
router.post('/create',auth,campaignController.createCampaign)
router.get('/show',auth,campaignController.showAllCampaign)
router.delete('/delete/:campaignId',auth,campaignController.deleteCampaign)

module.exports = router