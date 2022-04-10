const jwt = require("jsonwebtoken");
const logger = require('../logger/index');
require("dotenv").config();
const JWTSECRET = process.env.JWTSECRET;
//this middleware will on continue on if the token is inside the local storage

module.exports = function(req, res, next) {
  // Get token from header
  const accessToken = req.header("accessToken");
  // Check if not token
  if (!accessToken) {
    req.user = null;
        next();
  }

  // Verify token
  try {
    //it is going to give use the user id (user:{id: user.id})
    const verify = jwt.verify(accessToken, JWTSECRET);
    req.user = verify.user;
    next();
  } catch (err) {
    req.user = null;
        next();
  }
};
