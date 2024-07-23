var bcrypt = require("bcryptjs");
const connectDatabase = require("../config/database");

// GET
// /api/v1/users
exports.getUsers = async (req, res, next) => {
  try {
    const statement = "SELECT user.id, user.username, user.email, user.disabled FROM user";
    const result = await connectDatabase(statement);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      data: error
    });
  }
};

// GROUP NOT IMPLEMENTED YET, NOT FINISHED
// POST
// /api/v1/users
// parameters for create user, username, password, email, disabled, groups
exports.createUser = async (req, res, next) => {
  try {
    const requestdata = await req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(requestdata.password, 10);

    // Prepare the statement (use parameterized query to avoid SQL injection)
    const statement = `INSERT INTO user (username, password, email, disabled) VALUES (?, ?, ?, ?)`;
    const params = [requestdata.username, hashedPassword, requestdata.email, Number(requestdata.disabled)];

    const result = await connectDatabase(statement, params);

    // NEED TO HAVE SECOND STATEMENT FOR GROUP, INCOMPLETE

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    // catch any other error
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      data: error
    });
  }
};

// POST
// /api/v1/users/login
exports.authenticateUsers = async (req, res, next) => {
  try {
    const requestdata = await req.body;
    // edge case, should never happen, request body has no information or lacks username or password
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({
        success: false,
        error: "Missing username or password"
      });
    }

    const username = requestdata.username;
    const password = requestdata.password;

    // Prepare the statement (use parameterized query to avoid SQL injection)
    const statement = `SELECT * FROM user WHERE user.username = ?`;
    const params = [requestdata.username];

    const result = await connectDatabase(statement, params);

    // first point of failure, username does not exist in database
    if (Object.values(result).length != 1) {
      res.status(401).json({
        success: false,
        error: "Username does not exist"
      });
    }

    // Verify password
    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log("checking password matching: " + passwordMatch);

    // second point of failure, password is incorrect
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        error: "Password provided is incorrect"
      });
    }
    // third point of failure, user is disabled
    else if (result.disabled == true) {
      res.status(401).json({
        success: false,
        error: "User is currently disabled, please contact admin"
      });
    }
    // success, need to return a jwdt token details here, username, starttime, IP, browser tag, mac address.
    else {
      // return the jwdt token data here,
      const token_details = {
        username: user.username,
        starttime: "to be filled",
        ip: "to be filled",
        browsertag: "to be filled",
        macaddress: "to be filled"
      };
      res.status(200).json({
        success: true,
        data: token_details
      });
    }
  } catch (error) {
    // catch any other error
    console.error("Error:", error);
    res.status(400).json({
      success: false,
      data: error
    });
  }
};
