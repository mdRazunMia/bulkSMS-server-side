const database = require('../db/database')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Str = require('@supercharge/strings')
const  subUserCollection = database.collection("sub-user")
const {
    subUserCreateValidation, 
    subUserLoginValidation,
    subUserEditValidation,
    subUserPasswordResetValidation
} = require('../validations/validation')
const logger = require('../logger/logger')



const createSubUser = async (req, res)=>{
    const {error, value } = subUserCreateValidation(req.body)
    if(error) {
        logger.log({level: 'error', message: error.details[0].message})
        return res.status(400).send({message: {message: error.details[0].message}})
    }

    const userRole = req.query.role
    const subUserName = value.subUserName
    const password = value.subUserPassword
    const subUserRole = value.subUserRole
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const subUserPassword = hashedPassword
    const subUser = {}
    subUser.subUserName = subUserName
    subUser.subUserPassword = subUserPassword
    subUser.subUserRole = subUserRole
    if(userRole === "admin")
    {
        subUserCollection.insertOne(subUser,(err, data)=>{
            if(err){
                logger.log({level: 'error', message: 'Internal error for sub-user registration in database.'})
                return res.status(400).send("sub-user is not created.")
            } 
            logger.log({level: 'info', message: 'Sub-user has been created successfully.'})
            res.status(201).send({
                successMessage: "Sub-user has been created successfully.",
            })
        })
    }else{
        logger.log({level: 'warn', message: 'User is not authorized to create a sub-user.'})
        res.status(403).send("user is not authorized to create a sub-user.")
    }
}

const logInSubUser = (req, res)=>{
    const {error, value} = subUserLoginValidation(req.body)
    if(error){
        logger.log({level: 'error', message: error.details[0].message})
        return res.status(400).send({message: error.details[0].message})
    } 
    const subUserName = value.subUserName
    const subUserPassword = value.subUserPassword
    const subUserRole = value.subUserRole
    subUserCollection.findOne({subUserName: subUserName, subUserRole: subUserRole}, async (error, result)=>{
        if(error) {
            logger.log({level: 'error', message: 'Internal error for sub-user registration in database.'})
            return res.status(500).send({ errorMessage: "Something went wrong."})
        }
        if(!result){
           logger.log({level: 'error', message: 'No user found for this user name'})
           return res.status(404).send({errorMessage: "No user found for this user name"})
        }else{
            const isValid = await bcrypt.compare(subUserPassword,result.subUserPassword)
            if(isValid){
                logger.log({level: 'error', message: 'Sub-user has been logged in successfully.'})
                return  res.status(200).send({
                    successMessage: "User has been logged in successfully.",
                    subUserId: result._id,
                    subUserName: result.subUserName,
                    subUserRole: result.subUserRole
            })
            }else{
              logger.log({level: 'error', message: 'User password is not correct.'})
              return  res.status(401).send({
                    errorMessage: "User password is not correct."
                })
            } 
        }
    })
}

const getSubUserInformationForEdit = (req, res)=>{
    const subUserId = req.params.id
    const role = req.query.role
    if(role === 'admin' || role ==='sub-admin'){
        subUserCollection.findOne({_id: ObjectId(subUserId)}, (error, subUser)=>{
            if(error){
                logger.log({level: 'error', message: 'Internal error for sub-user edit information function in database.'})
                return res.status(500).send({errorMessage: "Something went wrong"})
            } 
            if(subUser !== null){
                logger.log({level: 'info', message: 'Send the sub user information for updated.'})
                res.status(200).send(subUser)
            }else{
                logger.log({level: 'error', message: 'here is no user for this Id.'})
                res.status(404).send({errorMessage: "There is no user for this Id."})
            }
        })
    }else{
        logger.log({level: 'error', message: 'User is not authorized to edit the sub-user information.'})
        res.status(403).send({errorMessage: "User is not authorized to edit the sub-user information."})
    }
}


const editSubUserInformation = (req, res)=>{
    const subUserId = req.params.id
    const role = req.query.role
    const {error, value } = subUserEditValidation(req.body)
    if(error){
        logger.log({level: 'error', message: error.details[0].message})
        return res.status(400).send({message: error.details[0].message})
    } 
    const subUserName = value.subUserName
    const subUserPassword = value.subUserPassword
    const subUserRole = value.subUserRole

    if(role === 'admin' || role ==='sub-admin'){
        subUserCollection.findOne({_id: ObjectId(subUserId)}, (error, subUser)=>{
            if(error){
                logger.log({level: 'error', message: 'Internal error for sub-user edit information function in database.'})
                return res.status(500).send({errorMessage: "Something went wrong"})
            }
            if(subUser !== null){
                const subUserInformationFilter = {_id: ObjectId(subUserId)}
                const subUserEditedInfo = { $set:{subUserName: subUserName, subUserPassword: subUserPassword, subUserRole: subUserRole}}
                subUserCollection.updateOne(subUserInformationFilter,subUserEditedInfo,(error, data)=>{
                    if(error) {
                        logger.log({level: 'error', message: 'Sub-user information has not been updated.'})
                        return res.status(400).send({errorMessage: "sub-user information has not been updated."})
                    }
                    logger.log({level: 'info', message: 'Sub-user information has been updated successfully.'})
                    return res.status(200).send({
                        successMessage: "sub-user information has been updated successfully.",
                        data: data
                    })
                })
            }else{
                logger.log({level: 'error', message: 'There is no sub-user for this Id.'})
                res.status(404).send({errorMessage: "There is no sub-user for this Id."})
            }
        })
    }else{
        logger.log({level: 'error', message: 'User is not authorized to edit the sub-user information.'})
        res.status(403).send({errorMessage: "User is not authorized to edit the sub-user information."})
    }
}


const editSubUserPassword = async (req, res)=>{
    const {error, value} = subUserPasswordResetValidation(req.body)
    if(error){
        logger.log({level: 'error', message: error.details[0].message})
        return res.status(400).send(error.details[0].message)
    }else{
    const subUserId = req.params.id
    const subUserRole = req.query.role
    const password = req.body.subUserPassword1
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const subUserPassword = hashedPassword
    if(subUserRole === 'admin' || subUserRole === 'sub-admin'){
        subUserCollection.findOne({_id: ObjectId(subUserId)},(error, subUser)=>{
            if(error) {
                logger.log({level: 'error', message: 'Internal error for sub-user edit password function in database.'})
                return res.send({errorMessage: "Something went wrong."})
            }
            if(!subUser){
                logger.log({level: 'error', message: 'sub-user is not found'})
                return res.status(404).send({ errorMessage: "User is not found"})
            }else{
                subUserFilterInfo = { _id: ObjectId(subUserId)}
                subUserUpdatedInfo = { $set: { subUserPassword: subUserPassword}}
                subUserCollection.updateOne(subUserFilterInfo,subUserUpdatedInfo,(error, data)=>{
                    if(error){
                        logger.log({level: 'error', message: 'User password is not updated.'})
                        return res.status(400).send({ errorMessage: "User password is not updated."})
                    } 
                    logger.log({level: 'info', message: 'User password has been updated successfully.'})
                    return res.status(200).send({
                        successMessage: "User password has been updated successfully.",
                        data: data
                    })
                })
            }
        })
    }else{
        logger.log({level: 'error', message: 'User is not authorized to edit the password.'})
        res.status(403).send({
            errorMessage: "User is not authorized to edit the password."
        })
    }
}

}

const deleteSubUser = (req, res)=>{
    const subUserId = req.params.id
    const userRole = req.query.role
    const deletedUserId = {_id: ObjectId(subUserId)}
    if(userRole === 'admin'){
        subUserCollection.deleteOne(deletedUserId,(err,data)=>{
            if(err){
                logger.log({level: 'error', message: 'Internal error for sub-user delete function in database.'})
                return res.status(500).send({ errorMessage: "Something went wrong."})
            } 
            logger.log({level: 'info', message: 'Sub-user successfully deleted.'})
            res.status(200).send({
                message: `Sub-user has been deleted successfully.`
            })
        })
    }else{
        logger.log({level: 'error', message: 'User is not authorized to delete this sub-user.'})
        res.status(403).send({
            errorMessage: "User is not authorized to delete this sub-user."
        })
    }
}


const showAllSubUser = async (req, res)=>{
    subUserCollection.find({}).toArray((err, result)=>{
        if(err){
            logger.log({level: 'error', message: 'Internal error for show sub-user function in database.'})
            return res.send({errorMessage: "Something went wrong."})
        } 
        if(!result){
            logger.log({level: 'error', message: 'There is no sub-user to show.'})
            res.status(404).send({ errorMessage: "There is no sub-user to show."})
        }else{
            logger.log({level: 'info', message: 'Send all the sub-users info.'})
            res.status(200).send(result)
        }
    })
}

module.exports = {
    createSubUser,
    editSubUserInformation,
    editSubUserPassword,
    deleteSubUser,
    showAllSubUser,
    getSubUserInformationForEdit,
    logInSubUser
}