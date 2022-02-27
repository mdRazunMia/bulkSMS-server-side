const jwt = require('jsonwebtoken')
const logger = require('../logger/logger')

const authRefreshToken = (req, res, next) => {
    const token = req.header('refresh-token')
    if (!token){
        logger.log({level: 'error', message: 'Authentication for refresh token access has been denied. | code: 10-2'})
        return res.status(401).send({ invalidRefreshTokenMessage: "Access Denied." })
    }
    try {
        const verified = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        req.user = verified
        next()
    } catch (error) {
        logger.log({level: 'error', message: 'Invalid refresh token or time is expired. | | code: 10-3'})
        res.status(401).send({ invalidRefreshTokenMessage: "Invalid Token or time is expired", verify: false})
    }
}

module.exports = authRefreshToken