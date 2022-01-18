
const logOutController = (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/logoutRedirect')
    })
}

module.exports = logOutController