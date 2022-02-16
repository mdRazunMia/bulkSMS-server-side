const jwt = require('jsonwebtoken')
const logger = require('../logger/logger')

const auth = (req, res, next) => {
    const token = req.header('auth-token')
    if (!token){
        logger.log({level: 'error', message: 'Authentication for refresh token access has been denied'})
        return res.status(401).send({ errorMessage: "Access Denied." })
    } 
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified
        next()
    } catch (error) {
        logger.log({level: 'error', message: 'Invalid Token or time is expired'})
        res.status(400).send({ errorMessage: "Invalid Token or time is expired",verify: false })
    }
}

module.exports = auth