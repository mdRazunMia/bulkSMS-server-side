const sendSMSJwt = (req, res) => {
  res.status(200).send(req.body);
};

module.exports = {
  sendSMSJwt,
};
