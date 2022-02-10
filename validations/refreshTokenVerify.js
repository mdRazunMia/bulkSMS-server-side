const jwt = require('jsonwebtoken')

const authRefreshToken = (req, res, next) => {
    const token = req.header('refresh-token')
    if (!token) return res.status(401).send({ 
        errorMessage: "Access Denied."
    })
    try {
        const verified = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        req.user = verified
        console.log(req.user)
        next()
    } catch (error) {
        res.status(401).send({ 
            errorMessage: "Invalid Token or time is expired",
            verify: false
        })
    }
}

module.exports = authRefreshToken