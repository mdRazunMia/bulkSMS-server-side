const database = require('../db/database')
const nodeMailer = require('nodemailer')
const md5 = require('md5')
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
const { ObjectId } = require('mongodb')
const { rules } = require('eslint-config-prettier')

const createSubUser = async (req, res)=>{
    const userRole = req.query.role
    const subUserName = req.body.subUserName
    const password = req.body.subUserPassword
    const subUserRole = req.body.subUserRole
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
            if(err) return res.json("sub-user is not created.")
            res.json({
                successMessage: "sub-user has been created successfully.",
            })
        })
    }else{
        res.json("user is not authorized to create a sub-user")
    }
}

const logInSubUser = (req, res)=>{
    const subUserName = req.body.subUserName
    const subUserPassword = req.body.subUserPassword
    console.log(subUserPassword)
    const subUserRole = req.body.subUserRole
    subUserCollection.findOne({subUserName: subUserName, subUserRole: subUserRole}, async (error, result)=>{
        if(error) return res.send({ errorMessage: "Something went wrong."})
        if(!result){
           return res.send({errorMessage: "No user found for this user name"})
        }else{
            console.log(result.subUserPassword)
            const isValid = await bcrypt.compare(subUserPassword,result.subUserPassword)
            console.log(isValid)
            if(isValid){
              return  res.send({
                    successMessage: "User has been logged in successfully.",
                    subUserId: result._id,
                    subUserName: result.subUserName,
                    subUserRole: result.subUserRole
            })
            }else{
              return  res.send({
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
            if(error) throw error
            if(subUser !== null){
                res.send(subUser)
            }else{
                res.send({errorMessage: "There is no user for this Id."})
            }
        })
    }else{
        res.send({errorMessage: "User is not authorized to edit the sub-user information."})
    }
    
}


const editSubUserInformation = (req, res)=>{
    const subUserId = req.params.id
    const role = req.query.role
    const subUserName = req.body.subUserName
    const subUserRole = req.body.subUserRole
    console.log(`subUserName: ${subUserName}, subUserRole: ${subUserRole}`)
    if(role === 'admin' || role ==='sub-admin'){
        subUserCollection.findOne({_id: ObjectId(subUserId)}, (error, subUser)=>{
            if(error) throw error
            if(subUser !== null){
                const subUserInformationFilter = {_id: ObjectId(subUserId)}
                const subUserEditedInfo = { $set:{subUserName: subUserName, subUserRole: subUserRole}}
                subUserCollection.updateOne(subUserInformationFilter,subUserEditedInfo,(error, data)=>{
                    if(error) return res.send({errorMessage: "sub-user information has not been updated."})
                    return res.send({
                        successMessage: "sub-user information has been updated successfully.",
                        data: data
                    })
                })
            }else{
                res.send({errorMessage: "There is no user for this Id."})
            }
        })
    }else{
        res.send({errorMessage: "User is not authorized to edit the sub-user information."})
    }

}


const editSubUserPassword = async (req, res)=>{
    const {error, value} = subUserPasswordResetValidation(req.body)
    if(error){
        return res.send(error.details[0].message)
    }else{
    const subUserId = req.params.id
    const subUserRole = req.query.role
    const password = req.body.subUserPassword1
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const subUserPassword = hashedPassword
    // const subUserConfirmPassword = req.body.subUserConfirmPassword
    if(subUserRole === 'admin' || subUserRole === 'sub-admin'){
        subUserCollection.findOne({_id: ObjectId(subUserId)},(error, subUser)=>{
            if(error) return res.send({errorMessage: "Something went wrong."})
            if(!subUser){
                return res.send({ errorMessage: "User is not found"})
            }else{
                subUserFilterInfo = { _id: ObjectId(subUserId)}
                subUserUpdatedInfo = { $set: { subUserPassword: subUserPassword}}
                subUserCollection.updateOne(subUserFilterInfo,subUserUpdatedInfo,(error, data)=>{
                    if(error) return res.send({ errorMessage: "User password is not updated."})
                    return res.send({
                        successMessage: "User password has been updated successfully.",
                        data: data
                    })
                })
            }
        })
    }else{
        res.send({
            errorMessage: "User is not authorized to edit the password."
        })
    }
}

}

const deleteSubUser = (req, res)=>{
    const subUserId = req.params.id
    const userRole = req.query.role
    console.log(`user id: ${subUserId} and user role: ${userRole}`)
    const deletedUserId = {_id: ObjectId(subUserId)}
    if(userRole === 'admin'){
        subUserCollection.deleteOne(deletedUserId,(err,data)=>{
            if(err) return res.send({ errorMessage: "Something went wrong."})
            res.send({
                message: `user id ${subUserId} has been deleted successfully`
            })
        })
    }else{
        res.send({
            errorMessage: "user is not authorized to delete this sub-user."
        })
    }
}


const showAllSubUser = async (req, res)=>{
    subUserCollection.find({}).toArray((err, result)=>{
        if(err) return res.send({errorMessage: "Something went wrong."})
        if(!result){
            res.send({ errorMessage: "There is no sub-user to show."})
        }else{
            res.send(result)
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