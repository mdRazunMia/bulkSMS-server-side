const express = require("express");
const router = express.Router();
const subUserController = require("../controllers/subUser.js");
const auth = require('../validations/verified')

router.post('/create',subUserController.createSubUser)
router.get('/showSubUsers',subUserController.showAllSubUser)
router.delete('/delete/:id', subUserController.deleteSubUser)
router.put('/editSubUser/:id', subUserController.editSubUserInformation)
router.post('/editSubUserPassword',subUserController.editSubUserPassword)

module.exports = router