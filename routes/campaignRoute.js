const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaign.js");
const auth = require("../validations/verify");
// const ACL = require("acl2");
// const acl = new ACL(new ACL.memoryBackend());
// acl.allow("sub-admin", ["view"]);
//CAMPAIGN ROUTE
// router.post(
//   "/create",
//   auth,
//   campaignController.uploadImageInfo,
//   campaignController.createCampaign
// );
router.post("/create", auth, campaignController.createCampaign);
router.get("/show", auth, campaignController.showAllCampaign);
router.delete("/delete/:campaignId", auth, campaignController.deleteCampaign);
//test data route
router.get("/data", campaignController.getData);

module.exports = router;
