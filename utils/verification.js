const dotenv = require("dotenv");
const connectDatabase = require("../utils/database");
const { verifyToken, generateToken, decodeToken, extractToken } = require("../utils/jwttoken");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// basic user authentication to be called on every page except login
// simple jwttoken check
const verifyUser = async req => {
  const cookieHeader = req.headers.cookie;
  // checking for cookies
  if (cookieHeader) {
    const token = await extractToken(JSON.stringify(cookieHeader));
    const verifiedtoken = await verifyToken(token);
    const decodedtoken = await decodeToken(req);
    // checking if the current user is disabled
    const username = decodedtoken.username;
    const statement = `SELECT user.disabled FROM user WHERE user.username = ?`;
    const params = [username];

    const result = await connectDatabase(statement, params);
    //console.log("result[0].disabled:" + result[0].disabled);
    return decodedtoken && !result[0].disabled;
  } else {
    return false;
  }
};

// admin user authentication to be called on usermanagement page
// will decrypt the token for username, check whether the username is admin or is in the 'admins' group
const verifyAdmin = async req => {
  const decodedtoken = await decodeToken(req);
  if (decodedtoken) {
    const username = decodedtoken.username;
    return (await checkGroup("admins", username)) || username === "admin";
  } else {
    return false;
  }
};

// internal api call, to be called by backend and not directly from frontend
const checkGroup = async (group, user) => {
  const statement = "SELECT * FROM usergroup where usergroup.groupname = ? and usergroup.username = ?";
  const params = [group, user];

  const result = await connectDatabase(statement, params);
  return result.length === 1;
};

// Username length must be >= 4 and <= 20 characters
// Username must be unique
// Username can be alphanumeric and can contain the special character underscore "_"
const verifyUsername = async username => {
  let errorstring = "";
  // Check if the username length is within the required range
  if (username.length < 4 || username.length > 20) {
    errorstring += " Username is not between 4 to 20 characters";
  }

  // Check if the username contains only alphanumeric characters and underscores
  const validUsernamePattern = /^[a-zA-Z0-9_]+$/;
  if (!validUsernamePattern.test(username)) {
    errorstring += " Username can contains only alphanumeric characters or underscores";
  }

  const usernamestatement = `SELECT user.username FROM user WHERE user.username = ?`;
  const usernameparams = [username];
  try {
    const usernameresult = await connectDatabase(usernamestatement, usernameparams);

    // Assuming the database returns an array with the result
    if (usernameresult[0].count > 0) {
      errorString += " Username already exists in the database";
    }
  } catch (error) {
    // Handle any errors that occur during the database query
    errorString += " An error occurred while checking the username. ";
    console.error("Database error:", error);
  }

  return errorstring;
};

// Password length must be >= 8 and <=10 characters
// Password must contain special character
// Password must contain alphanumeric
const verifyPassword = async password => {
  let errorstring = "";
  // Check if the password length is within the required range
  if (password.length < 8 || password.length > 10) {
    errorstring += " Password is not between 8 to 10 characters";
  }

  // Check if the password contains at least one special character
  const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialCharPattern.test(password)) {
    errorstring += " Password must contain atleast 1 special character";
  }

  return errorstring;
};

// Email cannot be empty
const verifyEmail = async email => {
  let errorstring = "";
  // Check if the password length is within the required range
  if (email.length === 0) {
    errorstring += " Email cannot be empty";
  }
  return errorstring;
};

// 2 group verfications, one for creating a new group and the other for checking if a group exist within the table
const verifyGroup = async groupName => {
  let errorstring = "";
  // Check if the group name length is within the required range
  if (groupName.length < 4 || groupName.length > 20) {
    errorstring += " groupname is not between 4 to 20 characters";
  }

  // Check if the group name contains only allowed characters (alphanumeric and underscore)
  // Check if the username contains only alphanumeric characters and underscores
  const validgroupnamePattern = /^[a-zA-Z0-9_]+$/;
  if (!validgroupnamePattern.test(groupName)) {
    errorstring += " groupname can contains only alphanumeric characters or underscores";
  }

  return errorstring;
};

const checkIfGroupsExist = async group => {
  let errorstring = "";
  try {
    const statement = "SELECT DISTINCT groupname FROM usergroup";
    const result = await connectDatabase(statement);

    // Extract group names from the result
    const GroupNames = result.map(row => row.groupname);

    group.forEach(names => {
      if (!GroupNames.includes(names)) {
        errorstring += " " + names + " does not exist in database";
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
  return errorstring;
};

module.exports = { verifyUser, verifyAdmin, checkGroup, verifyUsername, verifyPassword, verifyGroup, checkIfGroupsExist, verifyEmail };
