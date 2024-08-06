const bcrypt = require("bcryptjs");

const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const { getConnectionPool } = require("../config/database");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// POST
// /api/v1/users
// this api call is to be used in the user management page
exports.createUser = async (req, res, next) => {
  const pool = getConnectionPool();
  let errorstring = "";
  try {
    // reach this part only if a user is both verified and is an admin
    const requestdata = await req.body;

    // verifying username
    // check if the username variable has even been passed to the body,
    if (requestdata.username) {
      if (requestdata.username.length < 4 || requestdata.username.length > 20) {
        errorstring += "Username is not between 4 to 20 characters! ";
      }

      // Check if the username contains only alphanumeric characters and underscores
      const validUsernamePattern = /^[a-zA-Z0-9_]+$/;
      if (!validUsernamePattern.test(requestdata.username)) {
        errorstring += "Username can contains only alphanumeric characters or underscores! ";
      }
    } else {
      errorstring += "Username is empty! ";
    }

    // verifying password
    // check if the password variable has even been passed to the body
    if (requestdata.password) {
      // Check if the password length is within the required range
      if (requestdata.password.length < 8 || requestdata.password.length > 10) {
        errorstring += " Password is not between 8 to 10 characters";
      }

      // Check if the password contains at least one special character
      const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharPattern.test(requestdata.password)) {
        errorstring += " Password must contain atleast 1 special character";
      }

      // Check if the password contains at least one alphabet character
      const alphabetPattern = /[a-zA-Z]/;
      if (!alphabetPattern.test(requestdata.password)) {
        errorstring += " Password must contain at least 1 alphabet character.";
      }

      // Check if the password contains at least one numeric digit
      const numberPattern = /\d/;
      if (!numberPattern.test(requestdata.password)) {
        errorstring += " Password must contain at least 1 numeric digit.";
      }
    } else {
      errorstring += "Password is empty! ";
    }

    // verifying email
    // check if the email variable has even been passed to the body
    if (!requestdata.email || requestdata.email.length === 0) {
      errorstring += " Email cannot be empty";
    }

    // verifying groups
    // check if the groups we are adding the user in even exist
    if (requestdata.groups) {
      try {
        // get a list of groups that are currently available
        const verifygroupsstatement = "SELECT DISTINCT groupname FROM usergroup";
        const [verifygroupsresult] = await pool.execute(verifygroupsstatement);

        // Extract group names from the result, because database will return it as ["groupname" : name], we want it as an array so that we can just use the array.includes functionality
        const databasegroups = verifygroupsresult.map(row => row.groupname);

        // logical negate, we checking if our groups we adding to our user DOES NOT exist
        requestdata.groups.forEach(groupname => {
          if (!databasegroups.includes(groupname)) {
            errorstring += groupname + " does not exist in database! ";
          }
        });
      } catch (error) {
        // database error, should not hit unless something is wrong with database, throw 500 server response error
        console.error("Error:", error);
        // res.status(500).json({
        //   success: false,
        //   message: error
        // });
      }
    }

    // any errors with the inputs will be here in the error string so we will return an error code 400 here bad request
    if (errorstring.length > 0) {
      res.status(400).json({
        success: false,
        message: errorstring
      });
      return;
    }

    // now that we have confirmed that the user is authorised and the inputs are valid we can finally proceed with the creation of the user.
    const newusername = requestdata.username.toLowerCase();
    const newpassword = requestdata.password;
    const newemail = requestdata.email.toLowerCase();
    const newdisabled = requestdata.disabled !== false ? 1 : 0;
    const newgroups = requestdata.groups;
    const hashednewpassword = await bcrypt.hash(newpassword, 10);
    const createnewuserstatement = `INSERT INTO user (username, password, email, disabled) VALUES (?, ?, ?, ?)`;
    // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
    const createnewuserparams = [newusername, hashednewpassword, newemail, newdisabled];

    try {
      const [createnewuserresult] = await pool.execute(createnewuserstatement, createnewuserparams);

      console.log(createnewuserresult);

      console.log("server status of call: " + createnewuserresult.serverStatus);
      // successful user creation
      if (createnewuserresult.affectedRows === 1) {
        // now we need to add the groups of this user by updating the usergroup table
        newgroups.forEach(async group => {
          const groupstatement = `INSERT INTO usergroup ( groupname, username) VALUES ( ?, ?)`;
          const groupparams = [group, newusername];
          const [groupresults] = await pool.execute(groupstatement, groupparams);
        });
        // finished adding the user into the user table and groups into usergroup table, user has been successfully created return status 200
        res.status(200).json({
          success: true,
          message: "username: " + newusername + " successfully created"
        });
        return;
      }
    } catch (error) {
      // have to figure out the exact error code sql gives for duplicate entry so we can check it and send back 400, every other error will be 500 instead
      console.log(error);
      // sql error code for duplicate entry
      if (error.errno === 1062) {
        errorstring += "Duplicated Username! ";
        res.status(400).json({
          success: false,
          message: errorstring
        });
        return;
      } else {
        res.status(500).json({
          success: false,
          message: error
        });
      }
      return;
    }
  } catch (error) {
    // catch any other error, all errors should have been accounted for
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
    return;
  }
  res.status(400).json({
    success: false,
    message: "unknown error should never reach here"
  });
  return;
};

// GET
// /api/v1/users
// svelte server needs to access this
// this api call is to be used in the user management page
exports.getUsers = async (req, res, next) => {
  // console.log("Getting All Users");
  const pool = getConnectionPool();
  try {
    const statement = "SELECT user.username, user.email, user.disabled FROM user";
    const [result] = await pool.execute(statement);

    // result.forEach(element => {
    //   console.log("Username: " + element.username + ", Email: " + element.email + ", Disabled: " + element.disabled);
    // });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
};

// GET
// /api/v1/users/user/:username
// svelte server needs to access this
// this api call is to be used in the profile page
exports.getUser = async (req, res, next) => {
  console.log("Getting User");
  const pool = getConnectionPool();
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
    const statement = `SELECT user.username, user.email, user.disabled FROM user WHERE user.username = ?`;
    const params = [userusername];

    try {
      const [result] = await pool.execute(statement, params);
      if (result.length === 1) {
        // console.log("Successfully got Username:" + result[0].username + " Email:" + result[0].email + " Disabled:" + result[0].disabled);
        res.status(200).json({
          success: true,
          data: result
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          message: "User not found"
        });
        return;
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error
      });
      return;
    }
  } else {
    errorstring += "could not find any cookies attatched to header! ";
    res.status(401).json({
      success: false,
      message: errorstring
    });
  }
};

// PUT
// /api/v1/users/profile
// this api call is to be used in the profile page
exports.updateUserProfile = async (req, res, next) => {
  console.log("Updating user profile");
  const pool = getConnectionPool();
  let errorstring = "";
  try {
    let updatingpassword = true;

    // acquiring data sent in request
    const requestdata = await req.body;
    console.log(requestdata);
    // acquire the cookie from the request headers
    const cookies = req.headers.cookie;

    //only when the cookie exist can we extract out the token which we will use to acquire the username of the user
    // stringifying the cookie
    const JSONCookieString = JSON.stringify(cookies);

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
    // decoding the token to get the username
    const decodedToken = jwt.decode(token);
    const username = decodedToken.username.username;

    if (requestdata.password) {
      if (requestdata.password.length === 0) {
        updatingpassword = false;
      } else {
        // Check if the password length is within the required range
        if (requestdata.password.length < 8 || requestdata.password.length > 10) {
          errorstring += "Password is not between 8 to 10 characters! ";
        }

        // Check if the password contains at least one special character
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharPattern.test(requestdata.password)) {
          errorstring += "Password must contain atleast 1 special character !";
        }

        // Check if the password contains at least one alphabet character
        const alphabetPattern = /[a-zA-Z]/;
        if (!alphabetPattern.test(requestdata.password)) {
          errorstring += "Password must contain at least 1 alphabet character !";
        }

        // Check if the password contains at least one numeric digit
        const numberPattern = /\d/;
        if (!numberPattern.test(requestdata.password)) {
          errorstring += "Password must contain at least 1 numeric digit !";
        }
      }
    } else {
      updatingpassword = false;
    }

    // verifying email
    // check if the email variable has even been passed to the body
    if (!requestdata.email || requestdata.email.length === 0) {
      errorstring += "Email cannot be empty!";
    }

    //console.log(errorstring);
    // any errors with the inputs will be here in the error string so we will return an error code 400 here bad request
    if (errorstring.length > 0) {
      res.status(400).json({
        success: false,
        message: errorstring
      });
      return;
    }

    const password = requestdata.password;
    const email = requestdata.email.toLowerCase();

    if (updatingpassword) {
      console.log("Updating both password and email");
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const statement = `UPDATE user SET password = ?, email = ? WHERE username = ?`;
      const params = [hashedPassword, email, username];

      const [result] = await pool.execute(statement, params);
      // first point of failure, no updates were made, likely user does not exist
      if (result.affectedRows !== 1) {
        console.log("result.affectedRows not equal 1" + result.affectedRows);
        res.status(400).json({
          success: false,
          message: "Username does not exist"
        });
        return;
      } else {
        res.status(200).json({
          success: true,
          message: username + " has been successfully updated"
        });
      }
    } else {
      console.log("Updating email");
      const statement = `UPDATE user SET email = ? WHERE username = ?`;
      const params = [email, username];

      const [result] = await pool.execute(statement, params);
      // first point of failure, no updates were made, likely user does not exist
      if (result.affectedRows !== 1) {
        console.log("result.affectedRows not equal 1" + result.affectedRows);
        res.status(400).json({
          success: false,
          message: "Username does not exist"
        });
        return;
      } else {
        res.status(200).json({
          success: true,
          message: username + " has been successfully updated"
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error
    });
    return;
  }
};

// PUT
// /api/v1/users/
// this api call is to be used in the usermanagement page, updates everything
exports.updateUser = async (req, res, next) => {
  console.log("Updating User");
  const pool = getConnectionPool();
  let errorstring = "";
  try {
    // acquiring data sent in request
    const requestdata = await req.body;
    let updatingpassword = true;

    // verifying password
    // check if the password variable has even been passed to the body
    if (requestdata.password) {
      if (requestdata.password.length === 0) {
        updatingpassword = false;
      } else {
        // Check if the password length is within the required range
        if (requestdata.password.length < 8 || requestdata.password.length > 10) {
          errorstring += "Password is not between 8 to 10 characters! ";
        }

        // Check if the password contains at least one special character
        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharPattern.test(requestdata.password)) {
          errorstring += "Password must contain atleast 1 special character !";
        }

        // Check if the password contains at least one alphabet character
        const alphabetPattern = /[a-zA-Z]/;
        if (!alphabetPattern.test(requestdata.password)) {
          errorstring += "Password must contain at least 1 alphabet character !";
        }

        // Check if the password contains at least one numeric digit
        const numberPattern = /\d/;
        if (!numberPattern.test(requestdata.password)) {
          errorstring += "Password must contain at least 1 numeric digit !";
        }
      }
    } else {
      updatingpassword = false;
    }

    // verifying email
    // check if the email variable has even been passed to the body
    if (!requestdata.email || requestdata.email.length === 0) {
      errorstring += " Email cannot be empty";
    }

    // verifying groups
    // check if the groups we are adding the user in even exist
    if (requestdata.groups) {
      try {
        // get a list of groups that are currently available
        const verifygroupsstatement = "SELECT DISTINCT groupname FROM usergroup";
        const [verifygroupsresult] = await pool.execute(verifygroupsstatement);

        // Extract group names from the result, because database will return it as ["groupname" : name], we want it as an array so that we can just use the array.includes functionality
        const databasegroups = verifygroupsresult.map(row => row.groupname);

        // logical negate, we checking if our groups we adding to our user DOES NOT exist
        requestdata.groups.forEach(groupname => {
          if (!databasegroups.includes(groupname)) {
            errorstring += groupname + " does not exist in database! ";
          }
        });
      } catch (error) {
        // database error, should not hit unless something is wrong with database, throw 500 server response error
        console.error("Error:", error);
        res.status(500).json({
          success: false,
          message: error
        });
      }
    }

    // any errors with the inputs will be here in the error string so we will return an error code 400 here bad request
    if (errorstring.length > 0) {
      res.status(400).json({
        success: false,
        message: errorstring
      });
      return;
    }

    // now that we have confirmed that the user is authorised and the inputs are valid we can finally proceed with the creation of the user.
    const username = requestdata.username.toLowerCase();
    const updatepassword = requestdata.password;
    const updateemail = requestdata.email.toLowerCase();
    const updatedisabled = requestdata.disabled !== false ? 1 : 0;
    const updategroups = requestdata.groups;
    const hashedupdatepassword = await bcrypt.hash(updatepassword, 10);

    // no one can edit the admin's groups and status
    if (username === "admin") {
      if (updatingpassword) {
        const statement = `UPDATE user SET password = ?,email = ? WHERE user.username = ?`;
        const params = [hashedupdatepassword, updateemail, username];
        console.log("original password: " + updatepassword);
        const [result] = await pool.execute(statement, params);
        console.log(result);
        // first point of failure, no updates were made, likely user does not exist
        if (result.affectedRows != 1) {
          res.status(400).json({
            success: false,
            message: "Username does not exist"
          });
          return;
        }
      } else {
        const statement = `UPDATE user SET email = ? WHERE user.username = ?`;
        const params = [updateemail, username];

        const [result] = await pool.execute(statement, params);

        // first point of failure, no updates were made, likely user does not exist
        if (result.affectedRows != 1) {
          console.log("result.affectedRows not equal " + result.affectedRows);
          res.status(400).json({
            success: false,
            message: "Username does not exist"
          });
          return;
        }
      }
      console.log("successfully updated user: " + username);
      successfullyupdateduser = true;
    } else {
      if (updatingpassword) {
        const statement = `UPDATE user SET password = ?,email = ?,disabled =?  WHERE username = ?`;
        const params = [hashedupdatepassword, updateemail, updatedisabled, username];

        console.log("original password: " + updatepassword);
        const [result] = await pool.execute(statement, params);

        // first point of failure, no updates were made, likely user does not exist
        if (result.affectedRows != 1) {
          //console.log("result.affectedRows not equal 1" + result.affectedRows);
          res.status(400).json({
            success: false,
            message: "Username does not exist"
          });
          return;
        }
      } else {
        const statement = `UPDATE user SET email = ?,disabled =?  WHERE username = ?`;
        const params = [updateemail, updatedisabled, username];

        const [result] = await pool.execute(statement, params);

        // first point of failure, no updates were made, likely user does not exist
        if (result.affectedRows != 1) {
          //console.log("result.affectedRows not equal 1" + result.affectedRows);
          res.status(400).json({
            success: false,
            message: "Username does not exist"
          });
          return;
        }
      }
      console.log("successfully updated user: " + username);
      try {
        // deleting all group entries current user is in
        const deletegroupstatement = `DELETE FROM usergroup where username =? `;
        const deletegroupparams = [username];
        await pool.execute(deletegroupstatement, deletegroupparams);

        //inserting groups
        updategroups.forEach(async element => {
          const groupstatement = `INSERT INTO usergroup (groupname, username) VALUES (?, ?)`;
          const groupparams = [element, username];

          await pool.execute(groupstatement, groupparams);
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error
        });
        return;
      }
    }
    console.log("successfully updated user: " + username);
    //console.log(requestdata);
    res.status(200).json({
      success: true,
      message: username + " has been successfully updated"
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
};

exports.createGroup = async (req, res, next) => {
  const pool = getConnectionPool();
  const requestdata = await req.body;
  let errorstring = "";

  // check if the group name variable exist
  if (requestdata.groupname) {
    // verify the group name is legal
    const groupname = requestdata.groupname.toLowerCase();
    // Check if the group name length is within the required range
    if (groupname.length < 4 || groupname.length > 20) {
      errorstring += " groupname is not between 4 to 20 characters";
    }

    // Check if the group name contains only allowed characters (alphanumeric and underscore)
    // Check if the username contains only alphanumeric characters and underscores
    const validgroupnamePattern = /^[a-zA-Z0-9_]+$/;
    if (!validgroupnamePattern.test(groupname)) {
      errorstring += " groupname can contains only alphanumeric characters or underscores";
    }

    // any errors with the inputs will be here in the error string so we will return an error code 400 here bad request
    if (errorstring.length > 0) {
      res.status(400).json({
        success: false,
        message: errorstring
      });
      return;
    }

    const statement = `INSERT INTO usergroup ( groupname, username) VALUES ( ?, ?)`;

    const params = [groupname, "-"];
    try {
      const [result] = await pool.execute(statement, params);
      if (result.affectedRows === 1) {
        res.status(200).json({
          success: true,
          message: "group: " + groupname + " successfully created "
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          message: "unknown error, failed to create group in table number of affected rows: " + result.affectedRows
        });
      }
    } catch (error) {
      // have to figure out the exact error code sql gives for duplicate entry so we can check it and send back 400, every other error will be 500 instead
      console.log(error);
      // sql error code for duplicate entry
      if (error.errno === 1062) {
        errorstring += "Duplicated Group Name! ";
        res.status(400).json({
          success: false,
          message: errorstring
        });
        return;
      } else {
        res.status(500).json({
          success: false,
          message: error
        });
      }
    }
  } else {
    errorstring += "group name for newly created group was not provided in request! ";
    res.status(400).json({
      success: false,
      message: errorstring
    });
    return;
  }
};

// GET
// /api/v1/usergroups
exports.getUserGroups = async (req, res, next) => {
  const pool = getConnectionPool();
  try {
    const statement = "SELECT usergroup.groupname, usergroup.username FROM usergroup";
    const [result] = await pool.execute(statement);
    res.status(200).json({
      success: true,
      data: result
    });
    return;
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
    return;
  }
};

// GET
// /api/v1/groups
exports.getGroups = async (req, res, next) => {
  //console.log("getting groups");
  const pool = getConnectionPool();
  try {
    const statement = "SELECT DISTINCT groupname FROM usergroup";
    const [result] = await pool.execute(statement);
    res.status(200).json({
      success: true,
      data: result
    });
    return;
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
    return;
  }
};
