const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

const verifyToken = async req => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const token = req.headers.authorization.substring(7);

    // Verify the token
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  else
  {
    return false;
  }
};

const generateToken = async (user, req) => {
  return jwt.sign(
    {
      username: user,
      starttime: new Date(Date.now()),
      ip: req.ip,
      browsertag: req.useragent.browser,
      macaddress: "to be filled"
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_TIME
    }
  );
};

module.exports = { verifyToken, generateToken };
