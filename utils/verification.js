const dotenv = require("dotenv");
const { getConnectionPool } = require("../config/database");
const jwt = require("jsonwebtoken");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// basic user authentication to be called on every page except login
// simple jwttoken check
const verifyUser = async (req, res, next) => {
  //console.log("verifying user!");
  const pool = getConnectionPool();
  let errorstring = "";
  // make a call to ensure that the user assessing the database is verified and is not disabled
  let userisnotverified = true;
  let userisdisabled = true;
  let decodedTokenusername = "";
  // acquire the cookie from the request headers
  const cookies = req.headers.cookie;
  // getting our connection pool that we will be using for this API call

  // check if there is even any cookie that is attatched to the header, will crash backend since we are using an undefined variable otherwise
  if (cookies) {
    //only when the cookie exist can we extract out the token which we will use to acquire the username of the user
    // stringifying the cookie
    const JSONCookieString = JSON.stringify(cookies);
    ////console.log("RAW JWT as JSON: " + JSONCookieString);
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
    ////console.log("RAW JWT as JSON: " + token);
    // verifying the legitamancy of the token...
    ////console.log("Token value: " + token);
    try {
      // dont need the return value because if its legitimate it returns true otherwise it throws an error
      const tokenverification = await jwt.verify(token, process.env.JWT_SECRET);
      // //console.log(tokenverification);
      // will only reach here if the user is verified
      userisnotverified = false;
      //console.log("Token is verified!");
    } catch (error) {
      //console.log(error);
      errorstring += "JWT Token attatched cannot be verified! ";
    }

    // second user verification check, checking in database whether the use is disabled or not
    // extracting out the username from the token we acquired...

    try {
      const decodedToken = await jwt.decode(token);
      // //console.log("Decoded token value: " + JSON.stringify(decodedToken));
      decodedTokenusername = decodedToken.username.username;
      //console.log("Token is decoded!");
    } catch (error) {
      // theoratically should never reach here because the token is already verified, put here just incase
      //console.log(error);
      errorstring += "JWT Token attatched cannot be decoded! ";
    }

    // successfully acquired the username from the token we check the database to see if the user has been disabled
    if (decodedTokenusername.length !== 0) {
      const checkDisabledUserStatement = `SELECT user.disabled FROM user WHERE user.username = ?`;
      const checkDisabledUserparams = [decodedTokenusername];
      try {
        const [checkDisabledUserresult] = await pool.execute(checkDisabledUserStatement, checkDisabledUserparams);
        userisdisabled = checkDisabledUserresult[0].disabled;
        if (!userisdisabled) {
          userisdisabled = false;
        } else {
          errorstring += "User is disabled! ";
        }
      } catch (error) {
        //console.log(error);
        errorstring += "could not check if the user is disabled! ";
      }
    }
  } else {
    errorstring += "could not find any cookies attatched to header! ";
  }

  // if either of this values are true, the user is not authorised so we return 401 not authorised, and the frontend should kick them out of the application
  if (userisdisabled || userisnotverified) {
    res.status(401).json({
      success: false,
      message: errorstring
    });
    return;
  } else {
    next();
  }
};

// admin user authentication to be called on usermanagement page
// will decrypt the token for username, check whether the username is admin or is in the '' group
const verifyAdmin = async (req, res, next) => {
  let errorstring = "";
  let decodedTokenusername = "";
  let userisadmin = false;

  // acquire the cookie from the request headers
  const cookies = req.headers.cookie;
  // getting our connection pool that we will be using for this API call

  // check if there is even any cookie that is attatched to the header, will crash backend since we are using an undefined variable otherwise
  if (cookies) {
    //only when the cookie exist can we extract out the token which we will use to acquire the username of the user
    // stringifying the cookie
    const JSONCookieString = JSON.stringify(cookies);
    ////console.log("RAW JWT as JSON: " + JSONCookieString);
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

    // second user verification check, checking in database whether the use is disabled or not
    // extracting out the username from the token we acquired...

    try {
      const decodedToken = await jwt.decode(token);
      decodedTokenusername = decodedToken.username.username;
    } catch (error) {
      // theoratically should never reach here because the token is already verified, put here just incase
      errorstring += "JWT Token attatched cannot be decoded! ";
    }

    // now checking if the user is an admin
    // we want the logical negate of this because these statements prove that the user is an admin
    if ((await checkGroup(decodedTokenusername, "admin")) || decodedTokenusername === "admin") {
      //console.log("user is either named admin or is in admin group");
      userisadmin = true;
    } else {
      errorstring += "user is not an Admin! ";
    }
  } else {
    errorstring += "could not find any cookies attatched to header! ";
  }

  if (userisadmin) {
    next();
  } else {
    //console.log(errorstring);
    res.status(401).json({
      success: false,
      message: "User is not an admin"
    });
    return;
  }
};

//Checkgroup(userid, groupname)
// internal api call, to be called by backend and not directly from frontend
const checkGroup = async (user, group) => {
  const pool = getConnectionPool();
  const statement = "SELECT * FROM usergroup where usergroup.groupname = ? and usergroup.username = ?";
  const params = [group, user];

  const [result] = await pool.execute(statement, params);
  return result.length === 1;
};

module.exports = { verifyUser, verifyAdmin, checkGroup };
