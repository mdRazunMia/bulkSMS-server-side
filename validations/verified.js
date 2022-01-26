const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) return res.send({ errorMessage: "Access Denied." })
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified
        next()
    } catch (error) {
        res.send({ errorMessage: "Invalid Token or time is expired"})
    }
}

module.exports = auth