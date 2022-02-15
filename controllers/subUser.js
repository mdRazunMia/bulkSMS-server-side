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


const createSubUser = async (req, res)=>{
    const {error, value } = subUserCreateValidation(req.body)
    if(error) return res.status(400).send({message: {message: error.details[0].message}})

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
            if(err) return res.status(400).send("sub-user is not created.")
            res.status(201).send({
                successMessage: "sub-user has been created successfully.",
            })
        })
    }else{
        res.status(403).send("user is not authorized to create a sub-user")
    }
}

const logInSubUser = (req, res)=>{
    const {error, value} = subUserLoginValidation(req.body)
    if(error) return res.status(400).send({message: error.details[0].message})
    const subUserName = value.subUserName
    const subUserPassword = value.subUserPassword
    const subUserRole = value.subUserRole
    subUserCollection.findOne({subUserName: subUserName, subUserRole: subUserRole}, async (error, result)=>{
        if(error) return res.status(500).send({ errorMessage: "Something went wrong."})
        if(!result){
           return res.status(404).send({errorMessage: "No user found for this user name"})
        }else{
            const isValid = await bcrypt.compare(subUserPassword,result.subUserPassword)
            if(isValid){
              return  res.status(200).send({
                    successMessage: "User has been logged in successfully.",
                    subUserId: result._id,
                    subUserName: result.subUserName,
                    subUserRole: result.subUserRole
            })
            }else{
              return  res.status(401).send({
                    errorMessage: "User password is not correct"
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
            if(error) return res.status(500).send({errorMessage: "Something went wrong"})
            if(subUser !== null){
                res.status(200).send(subUser)
            }else{
                res.status(404).send({errorMessage: "There is no user for this Id."})
            }
        })
    }else{
        res.status(403).send({errorMessage: "User is not authorized to edit the sub-user information."})
    }
    
}


const editSubUserInformation = (req, res)=>{
    const subUserId = req.params.id
    const role = req.query.role
    const {error, value } = subUserEditValidation(req.body)

    if(error) return res.status(400).send({message: error.details[0].message})

    const subUserName = value.subUserName
    const subUserPassword = value.subUserPassword
    const subUserRole = value.subUserRole

    if(role === 'admin' || role ==='sub-admin'){
        subUserCollection.findOne({_id: ObjectId(subUserId)}, (error, subUser)=>{
            if(error) return res.status(500).send({errorMessage: "Something went wrong"})
            if(subUser !== null){
                const subUserInformationFilter = {_id: ObjectId(subUserId)}
                const subUserEditedInfo = { $set:{subUserName: subUserName, subUserPassword: subUserPassword, subUserRole: subUserRole}}
                subUserCollection.updateOne(subUserInformationFilter,subUserEditedInfo,(error, data)=>{
                    if(error) return res.status(400).send({errorMessage: "sub-user information has not been updated."})
                    return res.status(200).send({
                        successMessage: "sub-user information has been updated successfully.",
                        data: data
                    })
                })
            }else{
                res.status(404).send({errorMessage: "There is no user for this Id."})
            }
        })
    }else{
        res.status(403).send({errorMessage: "User is not authorized to edit the sub-user information."})
    }

}


const editSubUserPassword = async (req, res)=>{
    const {error, value} = subUserPasswordResetValidation(req.body)
    if(error){
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
            if(error) return res.send({errorMessage: "Something went wrong."})
            if(!subUser){
                return res.status(404).send({ errorMessage: "User is not found"})
            }else{
                subUserFilterInfo = { _id: ObjectId(subUserId)}
                subUserUpdatedInfo = { $set: { subUserPassword: subUserPassword}}
                subUserCollection.updateOne(subUserFilterInfo,subUserUpdatedInfo,(error, data)=>{
                    if(error) return res.status(400).send({ errorMessage: "User password is not updated."})
                    return res.status(200).send({
                        successMessage: "User password has been updated successfully.",
                        data: data
                    })
                })
            }
        })
    }else{
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
            if(err) return res.status(500).send({ errorMessage: "Something went wrong."})
            res.status(200).send({
                message: `user id ${subUserId} has been deleted successfully`
            })
        })
    }else{
        res.status(403).send({
            errorMessage: "user is not authorized to delete this sub-user."
        })
    }
}


const showAllSubUser = async (req, res)=>{
    subUserCollection.find({}).toArray((err, result)=>{
        if(err) return res.status(500).send({errorMessage: "Something went wrong."})
        if(!result){
            res.status(404).send({ errorMessage: "There is no sub-user to show."})
        }else{
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