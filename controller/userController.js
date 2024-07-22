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
