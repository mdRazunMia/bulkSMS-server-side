const Joi = require('@hapi/joi')

const registerValidation = (data) => {
    const schema = Joi.object({
    userFullName: Joi.string().min(6).max(255).required(),
    userEmail: Joi.string().email({ minDomainSegments: 2, tlds: {allow: ['com','net']}}).required(),
    userPassword1: Joi.string().min(8).max(25).required(),
    userPassword2:  Joi.ref('userPassword1')
    })
    return schema.validate(data)
}

const loginValidation = (data) => {
    const schema = Joi.object({
    userEmail: Joi.string().email({ minDomainSegments: 2, tlds: {allow: ['com','net']}}).required(),
    userPassword: Joi.string().min(8).max(25).required(),
    })
    return schema.validate(data)
}

const userUpdatePasswordValidation = (data) => {
    const schema = Joi.object({
        // userEmail: Joi.string().email({ minDomainSegments: 2, tlds: {allow: ['com','net']}}).required(),
        userCurrentPassword: Joi.string().min(8).max(25).required(),
        userPassword1: Joi.string().min(8).max(25).required(),
        userPassword2:  Joi.ref('userPassword1')
    })
    return schema.validate(data)
}


const userForgetPasswordValidation = (data) => {
    const schema = Joi.object({
        userPassword1: Joi.string().min(8).max(25).required(),
        userPassword2:  Joi.ref('userPassword1')
    })
    return schema.validate(data)
}

const subUserCreateValidation = (data)=>{
    const schema = Joi.object({
         subUserName: Joi.string().max(24).required(),
         subUserPassword: Joi.string().min(8).max(24).required(),
         subUserRole: Joi.string().max(24)
    })
    return schema.validate(data)
}

const subUserLoginValidation = (data)=>{
    const schema = Joi.object({
        subUserName: Joi.string().max(24).required(),
        subUserPassword: Joi.string().min(8).max(24).required()
    })

    return schema.validate(data)
}

const subUserEditValidation = (data)=>{
    const schema = Joi.object({
        subUserName: Joi.string().max(24).required(),
        subUserPassword: Joi.string().min(8).max(24).required(),
        subUserRole: Joi.string().max(24)
    })

    return schema.validate(data)
}

const subUserPasswordResetValidation = (data)=>{
    const schema = Joi.object({
        subUserPassword1: Joi.string().min(8).max(25).required(),
        subUserPassword2:  Joi.ref('subUserPassword1')
    })
    return schema.validate(data)
}

module.exports = {
    registerValidation,
    loginValidation,
    userUpdatePasswordValidation,
    subUserCreateValidation,
    subUserLoginValidation,
    subUserEditValidation,
    subUserPasswordResetValidation,
    userForgetPasswordValidation
}