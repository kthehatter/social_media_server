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
    console.log("no token found")
   return res.status(403).json({status: "403", message: "Authorization denied"});
  }

  // Verify token
  try {
    //it is going to give use the user id (user:{id: user.id})
    const verify = jwt.verify(accessToken, JWTSECRET);
    req.user = verify.user;
    next();
  } catch (err) {
        logger.error(err.message, err);
        return  res.status(401).json({status: "401", message: "invalid token"});
  }
};
