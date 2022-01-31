const express = require("express");
const router = express.Router();
const subUserController = require("../controllers/subUser.js");
const auth = require('../validations/verified')

router.post('/create',subUserController.createSubUser)
router.post('/login',subUserController.logInSubUser)
router.get('/showSubUsers',subUserController.showAllSubUser)
router.delete('/deleteSubUser/:id', subUserController.deleteSubUser)
router.put('/editSubUserInformation/:id', subUserController.editSubUserInformation)
router.get('/getSubUserInformationForEdit/:id', subUserController.getSubUserInformationForEdit)
router.post('/editSubUserPassword',subUserController.editSubUserPassword)

module.exports = router