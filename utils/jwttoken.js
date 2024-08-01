const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

const verifyToken = async token => {
  return jwt.verify(token, process.env.JWT_SECRET);
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

// decodes a token given a request
const decodeToken = async req => {
  try {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const token = await extractToken(JSON.stringify(cookieHeader));
      return await jwt.decode(token);
    } else {
      return null;
    }
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

const extractToken = async cookiestring => {
  // Find the position of the token part, which ends before the first semicolon
  let tokenEndIndex = cookiestring.indexOf(";");

  let tokenStartIndex = cookiestring.indexOf("=");
  if (tokenStartIndex === -1) {
    tokenStartIndex = 0;
  }
  if (tokenEndIndex === -1) {
    tokenEndIndex = cookiestring.length - 1;
  }

  const token = cookiestring.slice(tokenStartIndex + 1, tokenEndIndex);
  return token;
};

module.exports = { verifyToken, generateToken, decodeToken, extractToken };
