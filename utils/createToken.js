const jwt = require("jsonwebtoken");
require('dotenv').config();

const createToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.MOBILE_TOKEN,
    {
      expiresIn: "10m",
    }
  );
};


module.exports = {
  createToken,
}