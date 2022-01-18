const express = require("express");
const router = express.Router();
const passport = require('passport')
const linkedinController = require("../controllers/linkedInLogin")

router.post('/linkedInLogin',linkedinController.linkedInLogin)
router.get('/linkedInError',linkedinController.linkedInLogOut)

router.get('/linkedin',  passport.authenticate('linkedin', {
    scope: ['r_emailaddress', 'r_liteprofile'],
}))

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/auth/linkedInError' }),
  function(req, res) {
    console.log(req.user.displayName)
    const email = req.user.emails[0]
    console.log(email.value)
    res.send({
      name: req.user.displayName,
      email: req.user.emails[0]
    })
    // res.json("hello World")
    // res.redirect('http://localhost:3000');
    // res.redirect('/login')
  }
  );

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next()
}

module.exports = router