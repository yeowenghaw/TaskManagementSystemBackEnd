const bcrypt = require("bcryptjs");
const connectDatabase = require("../utils/database");

const { decodeToken } = require("../utils/jwttoken");
const { verifyUser, verifyAdmin, verifyUsername, verifyPassword, checkIfGroupsExist, verifyEmail } = require("../utils/verification");

// POST
// /api/v1/users
// this api call is to be used in the user management page
exports.createUser = async (req, res, next) => {
  try {
    if ((await verifyUser(req)) || (await verifyAdmin(req))) {
      //console.log("SUCCESS: Connected to protected route");
      const requestdata = await req.body;

      //before testing anything, make sure that username, password, email is valid if not valid send back errorcode 400, Bad Request Code

      let errorstring = "";
      errorstring += (await verifyUsername(requestdata.username)) + (await verifyPassword(requestdata.password)) + (await verifyEmail(requestdata.email)) + (await checkIfGroupsExist(requestdata.groups));

      if (errorstring.length > 0) {
        res.status(400).json({
          success: false,
          message: errorstring
        });
        return;
      }

      const username = requestdata.username.toLowerCase();
      const password = requestdata.password;
      const email = requestdata.email.toLowerCase();
      // converting true false to equilivent 0 1 that is stored in the sql server
      const disabled = requestdata.disabled !== false ? 1 : 0;
      const group = requestdata.groups;

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const statement = `INSERT INTO user (username, password, email, disabled) VALUES (?, ?, ?, ?)`;
      const params = [username, hashedPassword, email, disabled];

      const result = await connectDatabase(statement, params);

      // successful creation, now create the groups inside the database
      if (result.affectedRows === 1) {
        //
        group.forEach(async element => {
          const groupstatement = `INSERT INTO usergroup ( groupname, username) VALUES ( ?, ?)`;
          const groupparams = [element, requestdata.username];
          const groupresults = await connectDatabase(groupstatement, groupparams);
        });
        res.status(200).json({
          success: true,
          message: "username: " + requestdata.username + " successfully created"
        });
      } else {
        res.status(400).json({
          success: false,
          message: error
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: error
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

// GET
// /api/v1/users
// svelte server needs to access this
// this api call is to be used in the user management page
exports.getUsers = async (req, res, next) => {
  console.log("Getting All Users");
  try {
    if (await verifyUser(req)) {
      const statement = "SELECT user.username, user.email, user.disabled FROM user";
      const result = await connectDatabase(statement);

      result.forEach(element => {
        console.log("Username: " + element.username + ", Email: " + element.email + ", Disabled: " + element.disabled);
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Could not verify token, please log in again"
      });
    }
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
  try {
    if (await verifyUser(req)) {
      const userusername = req.params.username;
      const statement = `SELECT user.username, user.email, user.disabled FROM user WHERE user.username = ?`;
      const params = [userusername];
      const result = await connectDatabase(statement, params);
      if (result.length === 1) {
        console.log("Successfully got Username:" + result[0].username + " Email:" + result[0].email + " Disabled:" + result[0].disabled);
        res.status(200).json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: "User not found"
        });
      }
    } else {
      // log out unverified users
      res.status(401).json({
        success: false,
        message: "Could not verify token, please log in again"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
};

// PUT
// /api/v1/users/profile
// this api call is to be used in the profile page
exports.updateUserProfile = async (req, res, next) => {
  console.log("Updating Password");
  try {
    if (await verifyUser(req)) {
      // acquiring data sent in request
      const requestdata = await req.body;

      const password = requestdata.password;
      const email = requestdata.email.toLowerCase();

      //console.log(password);

      // decoding token attatched to determine user
      decodedtokenobject = await decodeToken(req);
      const username = decodedtokenobject.username;

      if (password) {
        let errorstring = "";
        errorstring += (await verifyPassword(password)) + (await verifyEmail(email));
        if (errorstring.length > 0) {
          console.log("Error Detected: " + errorstring);
          res.status(400).json({
            success: false,
            message: errorstring
          });
          return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const statement = `UPDATE user SET password = ?, email = ? WHERE username = ?`;
        const params = [hashedPassword, email, username];

        const result = await connectDatabase(statement, params);

        // first point of failure, no updates were made, likely user does not exist
        if (result.affectedRows !== 1) {
          console.log("result.affectedRows not equal 1" + result.affectedRows);
          res.status(400).json({
            success: false,
            message: "Username does not exist"
          });
          return;
        }
      } else {
        let errorstring = "";
        errorstring += await verifyEmail(email);
        if (errorstring.length > 0) {
          console.log("Error Detected: " + errorstring);
          res.status(400).json({
            success: false,
            message: errorstring
          });
          return;
        }

        // decoding token attatched to determine user
        decodedtokenobject = await decodeToken(req);
        const username = decodedtokenobject.username;

        const statement = `UPDATE user SET email = ? WHERE username = ?`;
        const params = [email, username];

        const result = await connectDatabase(statement, params);

        // first point of failure, no updates were made, likely user does not exist
        if (result.affectedRows !== 1) {
          console.log("result.affectedRows not equal 1" + result.affectedRows);
          res.status(400).json({
            success: false,
            message: "Username does not exist"
          });
          return;
        }
      }

      //console.log("successfully updated user: " + username + ", changing password to: " + password + ", changing email to: " + email);
      res.status(200).json({
        success: true,
        message: username + "'s email and password has successfully updated"
      });
    } else {
      console.log("token not verified for password");
      res.status(401).json({
        success: false,
        message: "Could not verify token, please log in again"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
};

// PUT
// /api/v1/users/
// this api call is to be used in the usermanagement page, updates everything
exports.updateUser = async (req, res, next) => {
  console.log("Updating User");
  try {
    if ((await verifyUser(req)) && (await verifyAdmin(req))) {
      // acquiring data sent in request
      const requestdata = await req.body;

      const username = requestdata.username.toLowerCase();
      const password = requestdata.password;
      const email = requestdata.email.toLowerCase();
      // converting true false to equilivent 0 1 that is stored in the sql server
      const disabled = requestdata.disabled !== false ? 1 : 0;
      const group = requestdata.groups;

      // no one can edit the admin's groups and status
      if (username === "admin") {
        let errorstring = "";

        if (password) {
          errorstring += (await verifyPassword(password)) + (await verifyEmail(email));

          if (errorstring.length > 0) {
            console.log("Error: " + errorstring);
            res.status(400).json({
              success: false,
              message: errorstring
            });
            return;
          }

          // Hash the password
          const hashedPassword = await bcrypt.hash(password, 10);

          const statement = `UPDATE user SET password = ?,email = ? WHERE user.username = ?`;
          const params = [hashedPassword, email, username];

          const result = await connectDatabase(statement, params);

          // first point of failure, no updates were made, likely user does not exist
          if (result.affectedRows != 1) {
            console.log("result.affectedRows not equal " + result.affectedRows);
            res.status(400).json({
              success: false,
              message: "Username does not exist"
            });
            return;
          }
        } else {
          errorstring += await verifyEmail(email);

          if (errorstring.length > 0) {
            console.log("Error: " + errorstring);
            res.status(400).json({
              success: false,
              message: errorstring
            });
            return;
          }

          const statement = `UPDATE user SET email = ? WHERE user.username = ?`;
          const params = [email, username];

          const result = await connectDatabase(statement, params);

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
        //console.log(requestdata);
        res.status(200).json({
          success: true,
          message: username + " has been successfully updated"
        });
      } else {
        //before testing anything, make sure that username, password, email is valid if not valid send back errorcode 400, Bad Request Code
        let errorstring = "";

        if (password) {
          errorstring += (await verifyPassword(password)) + (await verifyEmail(email)) + (await checkIfGroupsExist(group));

          if (errorstring.length > 0) {
            console.log("Error: " + errorstring);
            res.status(400).json({
              success: false,
              message: errorstring
            });
            return;
          }

          // Hash the password
          const hashedPassword = await bcrypt.hash(password, 10);

          const statement = `UPDATE user SET password = ?,email = ?,disabled =?  WHERE username = ?`;
          const params = [hashedPassword, email, disabled, username];

          const result = await connectDatabase(statement, params);

          // first point of failure, no updates were made, likely user does not exist
          if (result.affectedRows != 1) {
            console.log("result.affectedRows not equal 1" + result.affectedRows);
            res.status(400).json({
              success: false,
              message: "Username does not exist"
            });
            return;
          }
        } else {
          errorstring += (await verifyEmail(email)) + (await checkIfGroupsExist(group));

          if (errorstring.length > 0) {
            console.log("Error: " + errorstring);
            res.status(400).json({
              success: false,
              message: errorstring
            });
            return;
          }

          const statement = `UPDATE user SET email = ?,disabled =?  WHERE username = ?`;
          const params = [email, disabled, username];

          const result = await connectDatabase(statement, params);

          // first point of failure, no updates were made, likely user does not exist
          if (result.affectedRows != 1) {
            console.log("result.affectedRows not equal 1" + result.affectedRows);
            res.status(400).json({
              success: false,
              message: "Username does not exist"
            });
            return;
          }
        }

        // deleting all group entries current user is in
        const deletegroupstatement = `DELETE FROM usergroup where username =? `;
        const deletegroupparams = [requestdata.username];
        const deletgroupresult = await connectDatabase(deletegroupstatement, deletegroupparams);

        //inserting groups
        requestdata.groups.forEach(async element => {
          const groupstatement = `INSERT INTO usergroup (groupname, username) VALUES (?, ?)`;
          const groupparams = [element, username];

          const groupresult = await connectDatabase(groupstatement, groupparams);
        });

        console.log("successfully updated user: " + username);
        //console.log(requestdata);
        res.status(200).json({
          success: true,
          message: username + " has been successfully updated"
        });
      }
    } else {
      console.log("token not verified for password");
      res.status(401).json({
        success: false,
        message: "Could not verify token, please log in again"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      message: error
    });
  }
};
