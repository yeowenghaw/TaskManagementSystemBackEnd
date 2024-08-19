const { getConnectionPool } = require("../config/database");
const jwt = require("jsonwebtoken");

const transporter = require("../config/email"); // Import your transporter configuration

const dotenv = require("dotenv");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// POST
// /api/v1/app
exports.createApp = async (req, res, next) => {
  console.log("Create App is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  const requestdata = await req.body;

  console.log("creating app with the following params... ");
  console.log("app_acronym: " + requestdata.app_acronym);
  console.log("app_description: " + requestdata.app_description);
  console.log("app_rnumber: " + requestdata.app_rnumber);
  console.log("app_startdate: " + requestdata.app_startdate);
  console.log("app_enddate: " + requestdata.app_enddate);
  console.log("app_permit_create: " + requestdata.app_permit_create);
  console.log("app_permit_open: " + requestdata.app_permit_open);
  console.log("app_permit_todolist: " + requestdata.app_permit_todolist);
  console.log("app_permit_doing: " + requestdata.app_permit_doing);
  console.log("app_permit_done: " + requestdata.app_permit_done);

  if (requestdata.app_acronym !== undefined && requestdata.app_acronym !== "") {
    const acronymRegex = /^[a-zA-Z0-9_]+$/;

    if (requestdata.app_acronym.length < 4 || requestdata.app_acronym.length > 20) {
      errorstring += "app_acronym length must be >= 4 and <= 20 characters! ";
    }
    if (!acronymRegex.test(requestdata.app_acronym)) {
      errorstring += "app_acronym can be alphanumeric and can contain the special character underscore '_'! ";
    }
  } else {
    errorstring += "app_acronym cannot be empty! ";
  }

  // Validate Rnumber
  if (requestdata.app_rnumber !== undefined && requestdata.app_rnumber !== "") {
    if (!Number.isInteger(requestdata.app_rnumber) || requestdata.app_rnumber < 0) {
      errorstring += "app_rnumber must be a positive integer! ";
    }
  } else {
    errorstring += "app_rnumber cannot be empty! ";
  }

  const todaysdate = new Date().setHours(0, 0, 0, 0);

  // Validate app_startDate and app_enddate
  if (requestdata.app_startdate !== undefined && requestdata.app_startdate !== "") {
    const startdate = new Date(requestdata.app_startdate).setHours(0, 0, 0, 0);
    if (requestdata.app_enddate !== undefined && requestdata.app_enddate !== "") {
      const enddate = new Date(requestdata.app_enddate).setHours(0, 0, 0, 0);
      if (startdate > enddate) {
        errorstring += "app_enddate cannot be before the app_startDate.";
      }
    } else {
      errorstring += "app_enddate cannot be empty！ ";
    }
  } else {
    errorstring += "app_startDate cannot be empty！ ";
  }

  // check that all groups to be added exist, first get a map of all distinct groups then we can check one by one
  const distinctgroupstatement = "SELECT DISTINCT groupname FROM usergroup";
  let distinctgroups = [];
  try {
    await connection.beginTransaction();
    const [distinctgroupresult] = await connection.execute(distinctgroupstatement);
    distinctgroups = distinctgroupresult.map(row => row.groupname);
    await connection.commit();
  } catch (error) {
    console.log(error);
    await connection.rollback();
    errorstring += "failed to get groups from usergroup! ";
  }

  if (requestdata.app_permit_create) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_create.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_create)) {
        errorstring += requestdata.app_permit_create + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_create is... " + requestdata.app_permit_create);
  }

  if (requestdata.app_permit_open) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_open.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_open)) {
        errorstring += requestdata.app_permit_open + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_open is... " + requestdata.app_permit_open);
  }

  if (requestdata.app_permit_todolist) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_todolist.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_todolist)) {
        errorstring += requestdata.app_permit_todolist + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_todolist is... " + requestdata.app_permit_todolist);
  }

  if (requestdata.app_permit_todolist) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_todolist.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_todolist)) {
        errorstring += requestdata.app_permit_todolist + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_todolist is... " + requestdata.app_permit_todolist);
  }

  if (requestdata.app_permit_done) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_done.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_done)) {
        errorstring += requestdata.app_permit_done + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_done is... " + requestdata.app_permit_done);
  }

  if (errorstring.length > 0) {
    res.status(400).json({
      success: false,
      message: errorstring
    });
    connection.release();
    return;
  }

  const app_acronym = requestdata.app_acronym.toLowerCase();
  const app_description = requestdata.app_description;
  const app_rnumber = requestdata.app_rnumber;
  const app_startdate = requestdata.app_startdate;
  const app_enddate = requestdata.app_enddate;
  const app_permit_create = requestdata.app_permit_create;
  const app_permit_open = requestdata.app_permit_open;
  const app_permit_todolist = requestdata.app_permit_todolist;
  const app_permit_doing = requestdata.app_permit_todolist;
  const app_permit_done = requestdata.app_permit_done;

  const createnewappstatement = `INSERT INTO application 
  (app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist,app_permit_doing,app_permit_done) 
    VALUES (?,?,?,?,?,?,?,?,?,?);`;
  // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  const createnewappparams = [app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done];

  try {
    await connection.beginTransaction();
    const [createnewappresult] = await connection.query(createnewappstatement, createnewappparams);
    //console.log(createnewappresult);
    await connection.commit();
    res.status(200).json({
      success: true,
      message: "successfully created App: " + app_acronym
    });
    return;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    if (error.errno === 1062) {
      errorstring += "Duplicated App Name! ";
      res.status(400).json({
        success: false,
        message: errorstring
      });
    } else {
      res.status(500).json({
        success: true,
        message: "Could not create App: " + error
      });
    }
    return;
  } finally {
    connection.release();
  }
};

// GET
// /api/v1/app
exports.getApp = async (req, res, next) => {
  console.log("Get App is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  const requestdata = await req.body;

  const app_acronym = req.headers["app-acronym"];
  console.log("App Acronym:", app_acronym);

  // console.log(requestdata);
  // console.log("app_acronym: " + requestdata.app_acronym);
  // console.log("randomdata: " + requestdata.randomdata);
  // const app_acronym = requestdata.app_acronym;
  //console.log("detected params app_acronym: " + app_acronym);
  try {
    const statement = "SELECT * FROM application where application.app_acronym = ?";
    const params = [app_acronym];
    await connection.beginTransaction();
    const [result] = await connection.query(statement, params);
    await connection.commit();
    //console.log(result);
    if (result.length === 1) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: app_acronym + " does not exist! "
      });
    }
  } catch (error) {
    await connection.rollback();
    console.log(error);
    res.status(500).json({
      success: true,
      message: error
    });
  } finally {
    connection.release();
  }
};

// GET
// /api/v1/allapps
exports.getAllApps = async (req, res, next) => {
  console.log("Get getAllApps is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  try {
    const statement = "SELECT application.app_acronym FROM application";
    // const params = [group, user];
    await connection.beginTransaction();
    const [result] = await connection.query(statement);
    await connection.commit();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    await connection.rollback();
    console.log(error);
    res.status(500).json({
      success: true,
      message: error
    });
  } finally {
    connection.release();
  }
};

// PUT
// /api/v1/App
exports.updateApp = async (req, res, next) => {
  console.log("Update App is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  const requestdata = await req.body;

  // console.log("creating app with the following params... ");
  // console.log("app_description: " + requestdata.app_description);
  // console.log("app_startdate: " + requestdata.app_startdate);
  // console.log("app_enddate: " + requestdata.app_enddate);
  // console.log("app_permit_create: " + requestdata.app_permit_create);
  // console.log("app_permit_open: " + requestdata.app_permit_open);
  // console.log("app_permit_todolist: " + requestdata.app_permit_todolist);
  // console.log("app_permit_doing: " + requestdata.app_permit_doing);
  // console.log("app_permit_done: " + requestdata.app_permit_done);

  const todaysdate = new Date().setHours(0, 0, 0, 0);

  // Validate app_startDate and app_enddate
  if (requestdata.app_startdate !== undefined && requestdata.app_startdate !== "") {
    const startdate = new Date(requestdata.app_startdate).setHours(0, 0, 0, 0);
    if (requestdata.app_enddate !== undefined && requestdata.app_enddate !== "") {
      const enddate = new Date(requestdata.app_enddate).setHours(0, 0, 0, 0);
      if (startdate > enddate) {
        errorstring += "app_enddate cannot be before the app_startDate.";
      }
    } else {
      errorstring += "app_enddate cannot be empty！ ";
    }
  } else {
    errorstring += "app_startDate cannot be empty！ ";
  }

  // check that all groups to be added exist, first get a map of all distinct groups then we can check one by one
  const distinctgroupstatement = "SELECT DISTINCT groupname FROM usergroup";
  let distinctgroups = [];
  try {
    await connection.beginTransaction();
    const [distinctgroupresult] = await connection.execute(distinctgroupstatement);
    distinctgroups = distinctgroupresult.map(row => row.groupname);
    await connection.commit();
  } catch (error) {
    console.log(error);
    await connection.rollback();
    errorstring += "failed to get groups from usergroup! ";
  }

  if (requestdata.app_permit_create) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_create.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_create)) {
        errorstring += requestdata.app_permit_create + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_create is... " + requestdata.app_permit_create);
  }

  if (requestdata.app_permit_open) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_open.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_open)) {
        errorstring += requestdata.app_permit_open + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_open is... " + requestdata.app_permit_open);
  }

  if (requestdata.app_permit_todolist) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_todolist.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_todolist)) {
        errorstring += requestdata.app_permit_todolist + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_todolist is... " + requestdata.app_permit_todolist);
  }

  if (requestdata.app_permit_todolist) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_todolist.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_todolist)) {
        errorstring += requestdata.app_permit_todolist + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_todolist is... " + requestdata.app_permit_todolist);
  }

  if (requestdata.app_permit_done) {
    // can be blank so its a pass if our field is empty
    if (requestdata.app_permit_done.length !== 0) {
      if (!distinctgroups.includes(requestdata.app_permit_done)) {
        errorstring += requestdata.app_permit_done + " group does not exist! ";
      }
    }
  } else {
    console.log("value of requestdata.app_permit_done is... " + requestdata.app_permit_done);
  }

  if (errorstring.length > 0) {
    res.status(400).json({
      success: false,
      message: errorstring
    });
    connection.release();
    return;
  }

  const app_acronym = requestdata.app_acronym.toLowerCase();
  const app_description = requestdata.app_description;
  const app_startdate = requestdata.app_startdate;
  const app_enddate = requestdata.app_enddate;
  const app_permit_create = requestdata.app_permit_create;
  const app_permit_open = requestdata.app_permit_open;
  const app_permit_todolist = requestdata.app_permit_todolist;
  const app_permit_doing = requestdata.app_permit_doing;
  const app_permit_done = requestdata.app_permit_done;

  //`UPDATE user SET password = ?, email = ? WHERE username = ?`
  const createnewappstatement = `UPDATE application SET app_description = ?, app_startdate = ?, app_enddate = ?, app_permit_create = ?, app_permit_open = ?, app_permit_todolist = ?,app_permit_doing = ?,app_permit_done = ? WHERE app_acronym = ?`;
  // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  const createnewappparams = [app_description, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done, app_acronym];

  try {
    await connection.beginTransaction();
    const [createnewappresult] = await connection.query(createnewappstatement, createnewappparams);
    console.log(createnewappresult);
    await connection.commit();
    res.status(200).json({
      success: true,
      message: "successfully updated App: " + app_acronym
    });
    return;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    res.status(500).json({
      success: true,
      message: "Could not update App: " + error
    });
    return;
  } finally {
    connection.release();
  }
};

// POST
// /api/v1/plan
exports.createPlan = async (req, res, next) => {
  console.log("Create Plan is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  let decodedTokenusername = "";
  const requestdata = await req.body;

  console.log("plan_MVP_name: " + requestdata.plan_MVP_name);
  console.log("plan_startDate: " + requestdata.plan_startDate);
  console.log("plan_endDate: " + requestdata.plan_endDate);
  console.log("plan_app_Acronym: " + requestdata.plan_app_Acronym);

  let plan_MVP_name;
  let plan_startDate;
  let plan_endDate;
  let plan_app_Acronym;

  if (requestdata.plan_MVP_name) {
    plan_MVP_name = requestdata.plan_MVP_name.trim();
    plan_MVP_name = plan_MVP_name.toLowerCase();
    // Check the length (after trimming)
    if (requestdata.plan_MVP_name.length < 4 || requestdata.plan_MVP_name.length > 20) {
      errorstring += "plan_MVP_name must be between 4 to 20 characters! ";
    }

    // Check for invalid characters (only allows letters, numbers, spaces, and underscores)
    const regex = /^[A-Za-z0-9_ ]+$/;
    if (!regex.test(requestdata.plan_MVP_name)) {
      errorstring += "plan_MVP_name can only contain the special characters! ";
    }
  }

  if (requestdata.plan_startDate && requestdata.plan_endDate) {
    if (new Date(requestdata.plan_endDate) < new Date(requestdata.plan_startDate)) {
      errorstring += "plan_endDate cannot be before plan_startDate! ";
    } else {
      plan_startDate = requestdata.plan_startDate;
      plan_endDate = requestdata.plan_endDate;
    }
  } else {
    errorstring += "plan_startDate and plan_startDate cannot be empty! ";
  }

  if (requestdata.plan_app_Acronym) {
    plan_app_Acronym = requestdata.plan_app_Acronym;
  } else {
    errorstring += "plan_app_Acronym is empty! ";
  }

  // get usergroups

  const cookies = req.headers.cookie;
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
  } else {
    errorstring += "could not find any cookies attatched to header! ";
    res.status(401).json({
      success: false,
      message: errorstring
    });
    return;
  }

  try {
    const usergroupstatement = "SELECT usergroup.groupname FROM usergroup where usergroup.username = ?";
    const usergroupparams = [decodedTokenusername];
    const [usergroupresult] = await connection.query(usergroupstatement, usergroupparams);

    const usergrouparray = usergroupresult.map(item => item.groupname);

    if (!usergrouparray.includes("projectmanager")) {
      errorstring += decodedTokenusername + " does not have permissions to create a task";
    }
  } catch (error) {
    console.log(error);
    errorstring += error;
  }

  if (errorstring.length > 0) {
    res.status(400).json({
      success: false,
      message: errorstring
    });
    connection.release();
    return;
  }

  //plan_MVP_name, plan_startDate, plan_endDate, plan_app_Acronym
  const createnewplanstatement = `INSERT INTO plan 
  (plan_MVP_name, plan_startDate, plan_endDate, plan_app_Acronym) 
    VALUES (?,?,?,?);`;
  // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  const createnewplanparams = [plan_MVP_name, plan_startDate, plan_endDate, plan_app_Acronym];

  try {
    await connection.beginTransaction();
    const [createnewplanresult] = await connection.query(createnewplanstatement, createnewplanparams);
    //console.log(createnewappresult);
    await connection.commit();
    res.status(200).json({
      success: true,
      message: "successfully created App: " + plan_MVP_name
    });
  } catch (error) {
    console.log(error);
    await connection.rollback();
    if (error.errno === 1062) {
      errorstring += "Duplicated Plan Name! ";
      res.status(400).json({
        success: false,
        message: errorstring
      });
    } else {
      res.status(500).json({
        success: true,
        message: "Could not create Plan: " + error
      });
    }
    return;
  } finally {
    connection.release();
    return;
  }
};

// GET
// /api/v1/plan
exports.getPlan = async (req, res, next) => {
  console.log("Get Plans is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  const app_acronym = req.headers["app-acronym"];
  const plan_MVP_name = req.headers["plan-mvp-name"];
  if (app_acronym && plan_MVP_name) {
    try {
      //DATE(plan_startDate) AS plan_startDate, DATE(plan_endDate) AS plan_endDate

      //const statement = "SELECT * FROM plan where plan.plan_app_Acronym = ? and plan.plan_MVP_name = ?";
      const statement = "SELECT DATE_FORMAT(plan_startDate, '%Y-%m-%d') AS plan_startDate,  DATE_FORMAT(plan_endDate, '%Y-%m-%d') AS plan_endDate,plan_app_Acronym and plan_MVP_name FROM plan where plan.plan_app_Acronym = ? and plan.plan_MVP_name = ?";
      const params = [app_acronym, plan_MVP_name];
      await connection.beginTransaction();
      const [result] = await connection.query(statement, params);
      await connection.commit();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      await connection.rollback();
      console.log(error);
      res.status(500).json({
        success: true,
        message: error
      });
    } finally {
      connection.release();
    }
  } else {
    res.status(400).json({
      success: false,
      message: "app-acronym and plan-mvp-name could not be extracted from header!"
    });
    connection.release();
  }
};

// GET
// /api/v1/allplans
exports.getAllPlans = async (req, res, next) => {
  console.log("Get All Plans is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  const app_acronym = req.headers["app-acronym"];
  try {
    const statement = "SELECT * FROM plan where plan.plan_app_Acronym = ?";
    const params = [app_acronym];
    await connection.beginTransaction();
    const [result] = await connection.query(statement, params);
    await connection.commit();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    await connection.rollback();
    console.log(error);
    res.status(500).json({
      success: true,
      message: error
    });
  } finally {
    connection.release();
  }
};

// PUT
// /api/v1/Plan
exports.updatePlan = async (req, res, next) => {
  console.log("Update Plan is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  let decodedTokenusername;
  const requestdata = await req.body;

  console.log("plan_MVP_name: " + requestdata.plan_MVP_name);
  console.log("plan_startDate: " + requestdata.plan_startDate);
  console.log("plan_endDate: " + requestdata.plan_endDate);
  console.log("plan_app_Acronym: " + requestdata.plan_app_Acronym);

  let plan_MVP_name;
  let plan_startDate;
  let plan_endDate;
  let plan_app_Acronym;

  if (requestdata.plan_MVP_name) {
    plan_MVP_name = requestdata.plan_MVP_name.trim();
    plan_MVP_name = plan_MVP_name.toLowerCase();
    // Check the length (after trimming)
    if (requestdata.plan_MVP_name.length < 4 || requestdata.plan_MVP_name.length > 20) {
      errorstring += "plan_MVP_name must be between 4 to 20 characters! ";
    }

    // Check for invalid characters (only allows letters, numbers, spaces, and underscores)
    const regex = /^[A-Za-z0-9_ ]+$/;
    if (!regex.test(requestdata.plan_MVP_name)) {
      errorstring += "plan_MVP_name can only contain the special characters! ";
    }
  }

  if (requestdata.plan_startDate && requestdata.plan_endDate) {
    if (new Date(plan_endDate) < new Date(plan_startDate)) {
      errorstring += "plan_endDate cannot be before plan_startDate! ";
    } else {
      plan_startDate = requestdata.plan_startDate;
      plan_endDate = requestdata.plan_endDate;
    }
  } else {
    errorstring += "plan_startDate and plan_startDate cannot be empty! ";
  }

  if (requestdata.plan_app_Acronym) {
    plan_app_Acronym = requestdata.plan_app_Acronym;
  } else {
    errorstring += "plan_app_Acronym is empty! ";
  }

  const cookies = req.headers.cookie;
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
  } else {
    errorstring += "could not find any cookies attatched to header! ";
    res.status(401).json({
      success: false,
      message: errorstring
    });
    return;
  }

  try {
    const usergroupstatement = "SELECT usergroup.groupname FROM usergroup where usergroup.username = ?";
    const usergroupparams = [decodedTokenusername];
    const [usergroupresult] = await connection.query(usergroupstatement, usergroupparams);

    const usergrouparray = usergroupresult.map(item => item.groupname);

    if (!usergrouparray.includes("projectmanager")) {
      errorstring += decodedTokenusername + " does not have permissions to create a task";
    }
  } catch (error) {
    console.log(error);
    errorstring += error;
  }

  if (errorstring.length > 0) {
    res.status(400).json({
      success: false,
      message: errorstring
    });
    connection.release();
    return;
  }

  const updateplanstatement = `UPDATE plan SET plan_startDate =?, plan_endDate=? where plan_MVP_name =? and plan_app_Acronym =?`;
  const updateplanparams = [plan_startDate, plan_endDate, plan_MVP_name, plan_app_Acronym];

  try {
    await connection.beginTransaction();
    const [updateplanresult] = await connection.query(updateplanstatement, updateplanparams);
    //console.log(createnewappresult);
    await connection.commit();
    res.status(200).json({
      success: true,
      message: "successfully updated plan: " + plan_MVP_name
    });
  } catch (error) {
    console.log(error);
    await connection.rollback();
    res.status(500).json({
      success: true,
      message: "Could not updat Plan: " + error
    });

    return;
  } finally {
    connection.release();
    return;
  }
};

// POST
// /api/v1/task
exports.createTask = async (req, res, next) => {
  console.log("Create Task is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  const requestdata = await req.body;
  let applicationdata;
  let decodedTokenusername = "";

  // task name cannot be empty
  if (requestdata.task_name === undefined || requestdata.task_name === "") {
    errorstring += "task_name cannot be empty! ";
  }

  try {
    const getappstatement = "SELECT * FROM application where application.app_acronym = ?";
    const getappparams = [requestdata.app_acronym];
    connection.beginTransaction();
    const [getappresult] = await connection.query(getappstatement, getappparams);
    connection.commit();
    //console.log(getappresult);

    // console.log("getappresult result...");
    // console.log(getappresult);

    if (getappresult.length === 1) {
      applicationdata = getappresult[0];
    } else {
      errorstring += requestdata.app_acronym + " does not exist inside database! ";
    }
  } catch (error) {
    connection.rollback();

    res.status(500).json({
      success: true,
      message: error
    });
  }

  //console.log(applicationdata);

  const cookies = req.headers.cookie;
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
  } else {
    errorstring += "could not find any cookies attatched to header! ";
    res.status(401).json({
      success: false,
      message: errorstring
    });
    return;
  }

  try {
    const usergroupstatement = "SELECT usergroup.groupname FROM usergroup where usergroup.username = ?";
    const usergroupparams = [decodedTokenusername];
    const [usergroupresult] = await connection.query(usergroupstatement, usergroupparams);

    const usergrouparray = usergroupresult.map(item => item.groupname);

    if (!usergrouparray.includes(applicationdata.app_permit_create)) {
      errorstring += decodedTokenusername + " does not have permissions to create a task";
    }
  } catch (error) {
    console.log(error);
    errorstring += error;
  }

  if (errorstring.length > 0) {
    res.status(400).json({
      success: false,
      message: errorstring
    });
    connection.release();
    return;
  }

  const rawdate = new Date();

  const year = rawdate.getFullYear();
  const month = String(rawdate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(rawdate.getDate()).padStart(2, "0");
  const hours = String(rawdate.getHours()).padStart(2, "0");
  const minutes = String(rawdate.getMinutes()).padStart(2, "0");
  const seconds = String(rawdate.getSeconds()).padStart(2, "0");

  const task_createDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  const task_name = requestdata.task_name;
  const task_description = requestdata.task_description;
  const task_id = applicationdata.app_acronym + "_" + applicationdata.app_rnumber;
  const task_state = "open";
  let task_plan = requestdata.task_plan;
  const task_app_Acronym = applicationdata.app_acronym;
  const task_creator = decodedTokenusername;
  const task_owner = decodedTokenusername;

  console.log("task_name: " + task_name);
  console.log("task_description: " + task_description);
  console.log("task_id: " + task_id);
  console.log("task_state: " + task_state);
  console.log("task_createDate: " + task_createDate);
  console.log("task_plan: " + task_plan);
  console.log("task_app_Acronym: " + task_app_Acronym);
  console.log("task_creator: " + task_creator);
  console.log("task_owner: " + task_owner);

  if (task_plan.length < 1) {
    task_plan = null;
  }

  //create task
  const createnewtaskstatement = `INSERT INTO task 
  (task_name, task_description, task_id, task_state, task_createDate,task_plan, task_app_Acronym, task_creator,task_owner) 
    VALUES (?,?,?,?,?,?,?,?,?);`;
  // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  const createnewtaskparams = [task_name, task_description, task_id, task_state, task_createDate, task_plan, task_app_Acronym, task_creator, task_owner];

  try {
    await connection.beginTransaction();
    const [createnewtaskresult] = await connection.query(createnewtaskstatement, createnewtaskparams);

    //console.log(createnewtaskresult);

    if (createnewtaskresult.affectedRows === 0) {
      throw new Error("Failed to create new task");
    }

    //create task
    const newtasknotestatement = `INSERT INTO tasknote 
    (task_id, notes, tasknote_created) 
      VALUES (?,?,?);`;
    const notes = `[System, ${task_state}] task created by ${task_creator}, ${task_createDate}`;
    //const notes = `[User: ${task_creator}, State: ${task_state}, DateTime: ${task_createDate}] : ${task_creator} has created task: ${task_name} with id: ${task_id}`;
    // user, current state, date & time, note
    // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
    const newtasknoteparams = [task_id, notes, task_createDate];
    const [newtasknoteresult] = await connection.query(newtasknotestatement, newtasknoteparams);

    //console.log(newtasknoteresult);

    if (newtasknoteresult.affectedRows === 0) {
      throw new Error("Failed to create task note");
    }

    // successfully created task need to update the rnumber value in application
    //     UPDATE your_table_name
    const updaternumberstatement = `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`;
    // user, current state, date & time, note
    // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
    const updaternumberparams = [applicationdata.app_rnumber + 1, applicationdata.app_acronym];
    const [updaternumberresult] = await connection.query(updaternumberstatement, updaternumberparams);

    if (updaternumberresult.affectedRows === 0) {
      throw new Error("Failed to update rnumber");
    }

    await connection.commit();
    res.status(200).json({
      success: true,
      message: "successfully created Task: " + task_name + ", in Application: " + task_app_Acronym
    });
    return;
  } catch (error) {
    console.log(error);
    await connection.rollback();
    res.status(500).json({
      success: true,
      message: "Could not create Task: " + error
    });
    return;
  } finally {
    connection.release();
  }
};

// GET
// /api/v1/task
// get all task associated with application specified inside body
exports.getTask = async (req, res, next) => {
  console.log("Get Task is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  const requestdata = await req.body;
  const task_id = req.headers["task_id"];
  console.log("task_id: " + task_id);
  try {
    await connection.beginTransaction();
    const statement = "SELECT * FROM task where task.task_id = ?";
    const params = [task_id];
    const [result] = await connection.query(statement, params);

    //console.log(result);
    // if (result.affectedRows !== 1) {
    //   throw new Error("task for id not found");
    // }

    const tasknotestatement = "SELECT * FROM tasknote where tasknote.task_id = ? order by tasknote_created desc";
    const tasknoteparams = [task_id];
    const [tasknoteresult] = await connection.query(tasknotestatement, tasknoteparams);

    //console.log(tasknoteresult);

    // if (tasknoteresult.affectedRows !== 1) {
    //   throw new Error("task notes for id not found");
    // }

    await connection.commit();
    if (result.length === 1) {
      res.status(200).json({
        success: true,
        data: { result, tasknoteresult }
      });
      return;
    } else {
      res.status(400).json({
        success: false,
        message: task_id + " does not exist! "
      });
      return;
    }
  } catch (error) {
    await connection.rollback();
    console.log(error);
    res.status(500).json({
      success: true,
      message: error
    });
  } finally {
    connection.release();
  }
};

// GET
// /api/v1/alltasks
// get all task associated with application specified inside body
exports.getAllTask = async (req, res, next) => {
  console.log("Get All Task is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  const app_acronym = req.headers["app-acronym"];
  try {
    const statement = "SELECT * FROM task where task.task_app_Acronym = ?";
    const params = [app_acronym];
    await connection.beginTransaction();
    const [result] = await connection.query(statement, params);
    await connection.commit();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    await connection.rollback();
    console.log(error);
    res.status(500).json({
      success: true,
      message: error
    });
  } finally {
    connection.release();
  }
};

// PUT
// /api/v1/task
exports.updateTask = async (req, res, next) => {
  console.log("Update Task is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  const requestdata = await req.body;

  // console.log("task_id: " + requestdata.task_id);
  // console.log("task_description: " + requestdata.task_description);
  // console.log("task_plan: " + requestdata.task_plan);
  // console.log("task_notes: " + requestdata.task_notes);
  // console.log("task_state: " + requestdata.task_state);

  const taskid = requestdata.task_id;
  const newtaskdescription = requestdata.task_description;
  let newtaskplan = requestdata.task_plan;
  const newtasknotes = requestdata.task_notes;
  const newtaskstate = requestdata.task_state;

  if (!newtaskplan || newtaskplan.length < 1) {
    newtaskplan = null;
  }

  console.log("newtasknotes: " + newtasknotes);

  // using the task_id, acquire the original state of the task before this intended change

  try {
    await connection.beginTransaction();
    const originaltaskstatement = "SELECT * FROM task where task_id = ?";
    const originaltaskparams = [taskid];
    const [originaltaskresult] = await connection.query(originaltaskstatement, originaltaskparams);

    //console.log(originaltaskresult);

    if (originaltaskresult.length !== 1) {
      throw new Error("Failed to get original task");
    }

    const originaltask = originaltaskresult[0];

    // need to check if the state change is legal, originaltask.task_state
    //originaltask.task_app_Acronym

    const applicationstatement = "SELECT * FROM application where app_acronym = ?";
    const applicationparams = [originaltask.task_app_Acronym];
    const [applicationresult] = await connection.query(applicationstatement, applicationparams);

    if (applicationresult.length !== 1) {
      throw new Error("Failed to get application");
    }

    const currentapplication = applicationresult[0];

    let decodedTokenusername = "";

    // acquiring username from cookies
    const cookies = req.headers.cookie;
    if (cookies) {
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
      try {
        const decodedToken = await jwt.decode(token);
        decodedTokenusername = decodedToken.username.username;
      } catch (error) {
        // theoratically should never reach here because the token is already verified, put here just incase
        errorstring += "JWT Token attatched cannot be decoded! ";
      }
    } else {
      errorstring += "could not find any cookies attatched to header! ";
      res.status(401).json({
        success: false,
        message: errorstring
      });
      return;
    }

    const usergroupstatement = "SELECT usergroup.groupname FROM usergroup where usergroup.username = ?";
    const usergroupparams = [decodedTokenusername];
    const [usergroupresult] = await connection.query(usergroupstatement, usergroupparams);

    const usergrouparray = usergroupresult.map(item => item.groupname);

    // now we must check if the person making the changes have the permssions to change it
    switch (originaltask.task_state) {
      case "open":
        //console.log("original task is open");
        if (!usergrouparray.includes(currentapplication.app_permit_open)) {
          errorstring += "Current user has no permissions to change a task in open state! ";
        }
        break;
      case "todo":
        //console.log("original task is todo");
        if (!usergrouparray.includes(currentapplication.app_permit_todolist)) {
          errorstring += "Current user has no permissions to change a task in todo state! ";
        }
        break;
      case "doing":
        //console.log("original task is doing");
        if (!usergrouparray.includes(currentapplication.app_permit_doing)) {
          errorstring += "Current user has no permissions to change a task in doing state! ";
        }
        break;
      case "done":
        //console.log("original task is done");
        if (!usergrouparray.includes(currentapplication.app_permit_done)) {
          errorstring += "Current user has no permissions to change a task in done state! ";
        }
        break;
      default:
        //console.log("error should never hit here");
        errorstring += "Task is in unknown state could not verify permissions! ";
        break;
    }

    if (errorstring.length > 0) {
      res.status(400).json({
        success: false,
        message: errorstring
      });
      connection.release();
      return;
    }

    // now we check for every possible state change, this is needed to ensure that the change is legal, also we need to add into audit trail
    let newaudittrail = "";

    const rawdate = new Date();

    const year = rawdate.getFullYear();
    const month = String(rawdate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(rawdate.getDate()).padStart(2, "0");
    const hours = String(rawdate.getHours()).padStart(2, "0");
    const minutes = String(rawdate.getMinutes()).padStart(2, "0");
    const seconds = String(rawdate.getSeconds()).padStart(2, "0");

    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    let finalstate;

    if (!newtaskstate || newtaskstate === undefined) {
      finalstate = originaltask.task_state;
    } else {
      finalstate = newtaskstate;
    }

    // console.log("targeted end state: " + finalstate);
    // console.log("targeted newtaskstate: " + newtaskstate);

    // if there is no state change no need for any audit
    if (newtaskstate && newtaskstate !== undefined && originaltask.task_state !== newtaskstate) {
      // determining audit trail message
      if (originaltask.task_state === "open") {
        if (newtaskstate === "todo") {
          newaudittrail = "[System, todo] task released by " + decodedTokenusername + ", " + timestamp;
        }
      } else if (originaltask.task_state === "todo") {
        if (newtaskstate === "doing") {
          newaudittrail = "[System, doing] task taken on by " + decodedTokenusername + ", " + timestamp;
        }
      } else if (originaltask.task_state === "doing") {
        if (newtaskstate === "todo") {
          newaudittrail = "[System, todo] task given up by " + decodedTokenusername + ", " + timestamp;
        } else if (newtaskstate === "done") {
          newaudittrail = "[System, done] task submitted by " + decodedTokenusername + ", " + timestamp;
        }
      } else if (originaltask.task_state === "done") {
        if (newtaskstate === "closed") {
          newaudittrail = "[System, closed] task closed by " + decodedTokenusername + ", " + timestamp;
        } else if (newtaskstate === "doing") {
          newaudittrail = "[System, doing] task rejected by " + decodedTokenusername + ", " + timestamp;
        }
      }

      // if none of the audit trail conditions have that means the state change is illegal
      if (newaudittrail.length === 0) {
        errorstring += "Task state change is illegal, cannot change from " + originaltask.task_state + " to " + newtaskstate + "! ";
        res.status(400).json({
          success: false,
          message: errorstring
        });
        connection.release();
        return;
      }

      // now add the audit trail message to the tasknotes
      const audittrailstatement = `INSERT INTO tasknote (task_id, notes, tasknote_created) VALUES (?,?,?);`;
      const audittrailparams = [taskid, newaudittrail, timestamp];
      const [audittrailresult] = await connection.query(audittrailstatement, audittrailparams);
    }

    // so that there is not clash of unique key in task notes
    let additionalseconds = String(rawdate.getSeconds() + 1).padStart(2, "0");
    // if 59 seconds, cannot increment by 1s because it will be 60s which is illegal
    if (rawdate.getSeconds() === 59) {
      additionalseconds = String(rawdate.getSeconds() - 1).padStart(2, "0");
    }

    const forwardtimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${additionalseconds}`;

    // adding notes, only need to add if there is anything
    if (newtasknotes.length > 0) {
      // now add the audit trail message to the tasknotes
      const newnotestatement = `INSERT INTO tasknote (task_id, notes, tasknote_created) VALUES (?,?,?);`;

      const tasknotewithsystemmessage = `[${decodedTokenusername}'s comment, ${finalstate}] ${forwardtimestamp}\n${newtasknotes}\n`;
      //console.log(tasknotewithsystemmessage);
      // adding the prefix for notes [user's comment, state] datetime + \n
      //const newnoteparams = [taskid, tasknotewithsystemmessage, timestamp];

      const newnoteparams = [taskid, tasknotewithsystemmessage, forwardtimestamp];
      const [newnoteresult] = await connection.query(newnotestatement, newnoteparams);
    }

    // can only update the description and plan if the task is in the open or done state
    if (originaltask.task_state === "open" || originaltask.task_state === "done") {
      const updatetaskstatement = `UPDATE task SET task_description = ?, task_plan =? WHERE task_id = ?`;
      const updatetaskparams = [newtaskdescription, newtaskplan, taskid];
      const [updatetaskresult] = await connection.query(updatetaskstatement, updatetaskparams);
    }

    // only update the state and task ownder if there is a state change
    if (newaudittrail.length > 0) {
      const updatetaskstatestatement = `UPDATE task SET task_state = ?, task_owner =? WHERE task_id = ?`;
      const updatetaskstateparams = [finalstate, decodedTokenusername, taskid];
      const [updatetaskstateresult] = await connection.query(updatetaskstatestatement, updatetaskstateparams);

      // reach here only if there are no errors with updating the state change
      // send an email to everyone in the application "done group"
      if (finalstate === "done" && originaltask.task_state === "doing") {
        // getting all users that are in the done group...
        const doneuserstatestatement = `SELECT username FROM usergroup WHERE groupname = ?`;
        // params need to check the application, what is the group that is allowed to edit done task, currentapplication.app_permit_done
        const doneuserstateparams = [currentapplication.app_permit_done];
        const [doneuserstateresult] = await connection.query(doneuserstatestatement, doneuserstateparams);

        //console.log("All users that permissions for task DONE");
        //console.log(doneuserstateresult);

        const usernamelist = doneuserstateresult.map(row => row.username);
        //console.log(usernamelist);

        //         SELECT email
        // FROM user
        // WHERE username IN ('-', 'projectlead', 'user', 'user1', 'user5');

        const doneuseremailstatestatement = `SELECT email FROM user WHERE username IN (?)`;
        // params need to check the application, what is the group that is allowed to edit done task, currentapplication.app_permit_done
        const doneuseremailstateparams = [usernamelist];
        const [doneuseremailstateresult] = await connection.query(doneuseremailstatestatement, doneuseremailstateparams);

        const recipientsarray = doneuseremailstateresult.map(row => row.email);
        const recipientsstring = recipientsarray.join(", ");
        //console.log(recipientsstring);

        const mailOptions = {
          from: process.env.EMAILUSER, // Sender address
          to: recipientsstring, // List of recipients
          subject: "Task: " + originaltask.task_name + " with ID: " + originaltask.task_id + " in Application: " + currentapplication.app_acronym + " is done and ready for review", // Subject line
          text: newaudittrail // Plain text body
        };

        // Send the email
        await transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log("Email sent: " + info.response);
        });
        console.log(doneuseremailstateresult);
      }
    }

    await connection.commit();
  } catch (error) {
    console.log(error);
    await connection.rollback();
    res.status(400).json({
      success: false,
      message: error
    });
    return;
  } finally {
    connection.release();
  }

  // statement to update task plan and description

  res.status(200).json({
    success: true,
    message: "updating task"
  });
};

// POST
// /api/v1/Note
exports.createNote = async (req, res, next) => {
  console.log("Create Note is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "creating Note"
  });
};

// GET
// /api/v1/Note
exports.getNote = async (req, res, next) => {
  console.log("Get Note is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "getting Note"
  });
};

// PUT
// /api/v1/Note
exports.updateNote = async (req, res, next) => {
  console.log("Update Note is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "updating Note"
  });
};
