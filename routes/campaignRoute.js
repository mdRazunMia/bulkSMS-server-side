const express = require("express");
const router = express.Router();
const campaignController = require('../controllers/campaign.js')
const auth = require('../validations/verify')
//CAMPAIGN ROUTE
router.post('/create',auth,campaignController.uploadImageInfo,campaignController.createCampaign)
router.get('/show',auth,campaignController.showAllCampaign)
router.delete('/delete/:campaignId',auth,campaignController.deleteCampaign)

module.exports = router