const bcrypt = require("bcryptjs");
const connectDatabase = require("../utils/database");

const { generateToken } = require("../utils/jwttoken");
const { verifyUser, verifyAdmin } = require("../utils/verification");

const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

// POST
// /api/v1/login
// this api call is to be used in the login page
exports.authenticateUser = async (req, res, next) => {
  console.log("Authenticating User");
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

    const statement = `SELECT * FROM user WHERE user.username = ?`;
    const params = [requestdata.username];

    const result = await connectDatabase(statement, params);

    // first point of failure, username does not exist in database
    //console.log(result);
    if (result.length != 1) {
      res.status(401).json({
        success: false,
        message: "Username does not exist"
      });
      return;
    }

    // Verify password
    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    // second point of failure, password is incorrect
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: "Password provided is incorrect"
      });
    }
    // third point of failure, user is disabled
    else if (result[0].disabled === 1) {
      res.status(401).json({
        success: false,
        message: "User is currently disabled, please contact admin"
      });
    }
    // success, need to return a jwt token details here, username, starttime, IP, browser tag, mac address.
    else {
      const jwttoken = await generateToken(user.username, req);
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

// POST
// /api/v1/authenticate
exports.checkAuthentication = async (req, res, next) => {
  if (await verifyUser(req)) {
    console.log("user is verified");
    if (await verifyAdmin(req)) {
      console.log("user is an admin");
      res.status(200).json({
        success: true,
        message: "Authorized admin"
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Authorized user not admin"
      });
    }
  }
  // log out, because token is invalid or user is disabled
  else {
    console.log("user is unverified");
    res.clearCookie("token");
    res.status(400).json({
      success: false,
      message: "Unauthorized user"
    });
  }
};
