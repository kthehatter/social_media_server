const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWTSECRET = process.env.JWTSECRET;

function jwtGenerator(user_id,time_to_logged_in) {
  const payload = {
    user: {
      id: user_id
    }
  };
  return jwt.sign(payload, JWTSECRET, { expiresIn: time_to_logged_in });
}

module.exports = jwtGenerator;
