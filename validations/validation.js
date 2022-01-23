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

module.exports = {
    registerValidation,
    loginValidation
}