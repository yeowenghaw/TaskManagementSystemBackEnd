const connectDatabase = require("../utils/database");

const { verifyUser, verifyAdmin, verifyGroup } = require("../utils/verification");

const dotenv = require("dotenv");


// const useragent = require("express-useragent");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// GROUP NOT IMPLEMENTED YET, NOT FINISHED
// POST
// /api/v1/groups
// parameters for create user, username, password, email, disabled, groups
exports.createGroup = async (req, res, next) => {
  try {
    if ((await verifyUser(req)) || (await verifyAdmin(req))) {
      const requestdata = await req.body;

      const groupname = requestdata.groupname.toLowerCase();
      let errorstring = "";
      errorstring += await verifyGroup(groupname);
      if (errorstring.length > 0) {
        res.status(400).json({
          success: false,
          message: errorstring
        });
        return;
      }

      const statement = `INSERT INTO usergroup ( groupname, username) VALUES ( ?, ?)`;

      const params = [groupname, null];

      const result = await connectDatabase(statement, params);

      if (result.affectedRows === 1) {
        res.status(200).json({
          success: true,
          message: "group: " + groupname + " successfully created"
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
        message: "Could not verify token, please log in again"
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
// /api/v1/usergroups
exports.getUserGroups = async (req, res, next) => {
  try {
    if (await verifyUser(req)) {
      const statement = "SELECT usergroup.groupname, usergroup.username FROM usergroup";
      const result = await connectDatabase(statement);
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
// /api/v1/groups
exports.getGroups = async (req, res, next) => {
  try {
    if (await verifyUser(req)) {
      const statement = "SELECT DISTINCT groupname FROM usergroup";
      const result = await connectDatabase(statement);
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
