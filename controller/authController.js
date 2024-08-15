const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: "./config/config.env" });

const { getConnectionPool } = require("../config/database");

// POST
// /api/v1/login
// this api call is to be used in the login page
exports.authenticateUser = async (req, res, next) => {
  //console.log("Authenticating User");
  const pool = getConnectionPool();
  try {
    const requestdata = await req.body;

    // edge case, should never happen, request body has no information or lacks username or password
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: "Missing username or password"
      });
    }

    const username = requestdata.username;
    const password = requestdata.password;

    const statement = `SELECT user.username, user.password, user.disabled FROM user WHERE user.username = ?`;
    const params = [requestdata.username];

    const [result] = await pool.execute(statement, params);

    // first point of failure, username does not exist in database
    if (result.length != 1) {
      res.status(401).json({
        success: false,
        message: "Invalid Log in Details"
      });
      return;
    }

    // Verify password
    const user = result[0];
    //console.log("is user disabled?: " + result[0].disabled);

    const passwordMatch = await bcrypt.compare(password, user.password);

    // second point of failure, password is incorrect
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid Log in Details"
      });
      return;
    }
    // third point of failure, user is disabled
    else if (result[0].disabled === 1) {
      res.status(401).json({
        success: false,
        message: "User is currently disabled"
      });
      return;
    }
    // success, need to return a jwt token details here, username, starttime, IP, browser tag, mac address.
    else {
      const jwttoken = await jwt.sign(
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
      const options = {
        Expires: new Date(Date.now() + parseInt(process.env.COOKIE_EXPIRES_TIME) * 60 * 60 * 1000),
        httpOnly: true
      };

      console.log("Successfully Authenticated User: " + user.username);
      // only data being sent back, is a token which is attatched as a cookie
      res
        .status(200)
        .cookie("token", jwttoken, options)
        .json({
          success: true,
          message: username + " successfully logged in"
        });
    }
  } catch (error) {
    // catch any other error
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
};

// POST
// /api/v1/logout
exports.logoutUser = async (req, res, next) => {
  res.clearCookie("token");
  res.send("Cookies cleared");
  console.log("user logged out");
};

// GET
// /api/v1/group
// return all the groups that the user is in, does not require any cookie
exports.checkGroups = async (req, res, next) => {
  console.log("check user group is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  const cookies = req.headers.cookie;
  let decodedTokenusername = "";
  let errorstring = "";
  if (cookies) {
    //only when the cookie exist can we extract out the token which we will use to acquire the username of the user
    // stringifying the cookie
    const JSONCookieString = JSON.stringify(cookies);
    //console.log("RAW JWT as JSON: " + JSONCookieString);
    // parsing out the extra information attatched to acquire the raw token
    let tokenEndIndex = JSONCookieString.indexOf(";");
    let tokenStartIndex = JSONCookieString.indexOf("=");
    if (tokenStartIndex === -1) {
      tokenStartIndex = 0;
    }
    if (tokenEndIndex === -1) {
      tokenEndIndex = JSONCookieString.length - 1;
    }
    const token = JSONCookieString.slice(tokenStartIndex + 1, tokenEndIndex);
    try {
      const decodedToken = await jwt.decode(token);
      decodedTokenusername = decodedToken.username.username;
    } catch (error) {
      // theoratically should never reach here because the token is already verified, put here just incase
      errorstring += "JWT Token attatched cannot be decoded! ";
    }

    const userusername = decodedTokenusername;
    const statement = `SELECT usergroup.groupname FROM usergroup WHERE usergroup.username = ?`;
    const params = [userusername];

    try {
      //console.log("starting transaction");
      await connection.beginTransaction();
      const [result] = await connection.query(statement, params);
      await connection.commit();
      //console.log("result success transaction");
      //console.log(result);
      res.status(200).json({
        success: true,
        data: result
      });
      return;
    } catch (error) {
      console.log(error);
      await connection.rollback();
      res.status(500).json({
        success: false,
        message: error
      });
      return;
    } finally {
      connection.release();
    }
  }
  // no cookies just means that no user logged in so no group
  else {
    res.status(200).json({
      success: false,
      data: {}
    });
  }
};

// GET
// /api/v1/user
// empty call, just to make sure jwttoken is valid and user is not disabled
exports.checkUser = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Valid User"
  });
};

// GET
// /api/v1/admin
// empty call, just as verify user and verify admin inside
exports.checkAdmin = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Authorized admin"
  });
};

// GET
// /api/v1/projectlead
// empty call, just as verify user and verify admin inside
exports.checkProjectLead = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Authorized Project Lead"
  });
};
