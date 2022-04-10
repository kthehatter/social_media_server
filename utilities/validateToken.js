

const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWTSECRET = process.env.JWTSECRET;

function tokenValidator(accessToken) {
    try {
        //it is going to give use the user id (user:{id: user.id})
        const verify = jwt.verify(accessToken, JWTSECRET);
        userId = verify.user;
        return userId;
      } catch (err) {
            return  null;
      }
  }



module.exports = tokenValidator;