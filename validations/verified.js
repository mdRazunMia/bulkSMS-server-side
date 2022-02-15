const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) return res.status(401).send({ 
        errorMessage: "Access Denied."
    })
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified
        next()
    } catch (error) {
        res.status(400).send({ 
            errorMessage: "Invalid Token or time is expired",
            verify: false
        })
    }
}

module.exports = auth