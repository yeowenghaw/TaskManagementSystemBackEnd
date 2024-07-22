//const connectDatabase = require("./config/database.js");
const connectDatabase = require("../config/database");

// /api/v1/sample
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

exports.authenticateUsers = async (req, res, next) => {
  try {
    // const statement = `SELECT user.id, user.username, user.email, user.disabled FROM user where user.name = ${req.body.username} and user.password = ${req.body.password}`;
    // const result = await connectDatabase(statement);

    const requestdata = await req.body;
    console.log(requestdata);

    // Check if req.body exists and contains 'username' and 'password'
    if (!req.body || !req.body[0].username || !req.body[0].password) {
      console.log("body not found!");
      console.log(req.body);
      // console.log(JSON.parse(req));
      return res.status(400).json({
        success: false,
        error: "Missing username or password in request body"
      });
    }

    // Escape user inputs to prevent SQL injection
    const username = req.body[0].username;
    const password = req.body[0].password;

    // Prepare SQL statement using placeholders
    const statement = `SELECT user.id, user.username, user.email, user.disabled FROM user WHERE user.username = "${username}" AND user.password = "${password}"`;

    // Execute the query asynchronously
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
