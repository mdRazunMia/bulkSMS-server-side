const database = require('../db/database')
const nodeMailer = require('nodemailer')
const md5 = require('md5')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Str = require('@supercharge/strings')
const  subUserCollection = database.collection("sub-user")
const {registerValidation,loginValidation} = require('../validations/validation')
const { ObjectId } = require('mongodb')
const { rules } = require('eslint-config-prettier')

const createSubUser = (req, res)=>{
    const userRole = req.query.role
    if(userRole === "admin")
    {
        subUserCollection.insertOne(req.body,(err, data)=>{
            if(err) return res.json("sub-user is not created.")
            res.json({
                successMessage: "sub-user has been created successfully.",
            })
        })
    }else{
        res.json("user is not authorized to create a sub-user")
    }
}

const editSubUserInformation = (req, res)=>{}

const editSubUserPassword = (req, res)=>{}

const deleteSubUser = (req, res)=>{
    const subUserId = req.params.id
    const userRole = req.query.role
    console.log(`user id: ${subUserId} and user role: ${userRole}`)
    const deletedUserId = {_id: ObjectId(subUserId)}
    if(userRole === 'admin'){
        subUserCollection.deleteOne(deletedUserId,(err,data)=>{
            if(err) throw err
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
    showAllSubUser
}