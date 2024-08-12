const { getConnectionPool } = require("../config/database");
const jwt = require("jsonwebtoken");

// POST
// /api/v1/app
exports.createApp = async (req, res, next) => {
  console.log("Create App is called!");
  const pool = getConnectionPool();
  const connection = await pool.getConnection();
  let errorstring = "";
  const requestdata = await req.body;

  // console.log("creating app with the following params... ");
  // console.log("app_acronym: " + requestdata.app_acronym);
  // console.log("app_description: " + requestdata.app_description);
  // console.log("app_rnumber: " + requestdata.app_rnumber);
  // console.log("app_startdate: " + requestdata.app_startdate);
  // console.log("app_enddate: " + requestdata.app_enddate);
  // console.log("app_permit_create: " + requestdata.app_permit_create);
  // console.log("app_permit_open: " + requestdata.app_permit_open);
  // console.log("app_permit_todolist: " + requestdata.app_permit_todolist);
  // console.log("app_permit_doing: " + requestdata.app_permit_doing);
  // console.log("app_permit_done: " + requestdata.app_permit_done);

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
    console.log(createnewappresult);
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
  const app_acronym = requestdata.app_acronym;
  console.log("detected params app_acronym: " + app_acronym);
  try {
    const statement = "SELECT * FROM application where application.app_acronym = ?";
    const params = [app_acronym];
    await connection.beginTransaction();
    const [result] = await connection.query(statement, params);
    await connection.commit();
    console.log(result);
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
  const app_permit_doing = requestdata.app_permit_todolist;
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
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "creating Plan"
  });
};

// GET
// /api/v1/Plan
exports.getPlan = async (req, res, next) => {
  console.log("Get Plan is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "getting Plan"
  });
};

// PUT
// /api/v1/Plan
exports.updatePlan = async (req, res, next) => {
  console.log("Update Plan is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "updating Plan"
  });
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
  const task_plan = requestdata.task_plan;
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

  // const createnewtaskstatement = `INSERT INTO task
  // (task_name, task_description, task_id, task_state, task_createDate, task_plan, task_app_Acronym, task_creator,task_owner)
  //   VALUES (?,?,?,?,?,?,?,?,?);`;
  // // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  // const createnewtaskparams = [task_name, task_description, task_id, task_state, task_createDate, task_plan, task_app_Acronym, task_creator, task_owner];

  //create task
  const createnewtaskstatement = `INSERT INTO task 
  (task_name, task_description, task_id, task_state, task_createDate, task_app_Acronym, task_creator,task_owner) 
    VALUES (?,?,?,?,?,?,?,?);`;
  // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  const createnewtaskparams = [task_name, task_description, task_id, task_state, task_createDate, task_app_Acronym, task_creator, task_owner];

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
    // SET app_rnumber = app_rnumber + 1
    // WHERE app_acronym = 'banana' AND app_startdate = '2024-08-12';
    //updateapplication rnumber
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

  // // Validate app_startDate and app_enddate
  // if (requestdata.app_startdate !== undefined && requestdata.app_startdate !== "") {
  //   const startdate = new Date(requestdata.app_startdate).setHours(0, 0, 0, 0);
  //   if (requestdata.app_enddate !== undefined && requestdata.app_enddate !== "") {
  //     const enddate = new Date(requestdata.app_enddate).setHours(0, 0, 0, 0);
  //     if (startdate > enddate) {
  //       errorstring += "app_enddate cannot be before the app_startDate.";
  //     }
  //   } else {
  //     errorstring += "app_enddate cannot be empty！ ";
  //   }
  // } else {
  //   errorstring += "app_startDate cannot be empty！ ";
  // }

  // // check that all groups to be added exist, first get a map of all distinct groups then we can check one by one
  // const distinctgroupstatement = "SELECT DISTINCT groupname FROM usergroup";
  // let distinctgroups = [];
  // try {
  //   connection.beginTransaction();
  //   const [distinctgroupresult] = await connection.execute(distinctgroupstatement);
  //   distinctgroups = distinctgroupresult.map(row => row.groupname);
  //   connection.commit();
  // } catch (error) {
  //   console.log(error);
  //   connection.rollback();
  //   errorstring += "failed to get groups from usergroup! ";
  // }

  // if (requestdata.app_permit_create) {
  //   // can be blank so its a pass if our field is empty
  //   if (requestdata.app_permit_create.length !== 0) {
  //     if (!distinctgroups.includes(requestdata.app_permit_create)) {
  //       errorstring += requestdata.app_permit_create + " group does not exist! ";
  //     }
  //   }
  // } else {
  //   console.log("value of requestdata.app_permit_create is... " + requestdata.app_permit_create);
  // }

  // if (requestdata.app_permit_open) {
  //   // can be blank so its a pass if our field is empty
  //   if (requestdata.app_permit_open.length !== 0) {
  //     if (!distinctgroups.includes(requestdata.app_permit_open)) {
  //       errorstring += requestdata.app_permit_open + " group does not exist! ";
  //     }
  //   }
  // } else {
  //   console.log("value of requestdata.app_permit_open is... " + requestdata.app_permit_open);
  // }

  // if (requestdata.app_permit_todolist) {
  //   // can be blank so its a pass if our field is empty
  //   if (requestdata.app_permit_todolist.length !== 0) {
  //     if (!distinctgroups.includes(requestdata.app_permit_todolist)) {
  //       errorstring += requestdata.app_permit_todolist + " group does not exist! ";
  //     }
  //   }
  // } else {
  //   console.log("value of requestdata.app_permit_todolist is... " + requestdata.app_permit_todolist);
  // }

  // if (requestdata.app_permit_todolist) {
  //   // can be blank so its a pass if our field is empty
  //   if (requestdata.app_permit_todolist.length !== 0) {
  //     if (!distinctgroups.includes(requestdata.app_permit_todolist)) {
  //       errorstring += requestdata.app_permit_todolist + " group does not exist! ";
  //     }
  //   }
  // } else {
  //   console.log("value of requestdata.app_permit_todolist is... " + requestdata.app_permit_todolist);
  // }

  // if (requestdata.app_permit_done) {
  //   // can be blank so its a pass if our field is empty
  //   if (requestdata.app_permit_done.length !== 0) {
  //     if (!distinctgroups.includes(requestdata.app_permit_done)) {
  //       errorstring += requestdata.app_permit_done + " group does not exist! ";
  //     }
  //   }
  // } else {
  //   console.log("value of requestdata.app_permit_done is... " + requestdata.app_permit_done);
  // }

  // if (errorstring.length > 0) {
  //   res.status(400).json({
  //     success: false,
  //     message: errorstring
  //   });
  //   connection.release();
  //   return;
  // }

  // const app_acronym = requestdata.app_acronym.toLowerCase();
  // const app_description = requestdata.app_description;
  // const app_startdate = requestdata.app_startdate;
  // const app_enddate = requestdata.app_enddate;
  // const app_permit_create = requestdata.app_permit_create;
  // const app_permit_open = requestdata.app_permit_open;
  // const app_permit_todolist = requestdata.app_permit_todolist;
  // const app_permit_doing = requestdata.app_permit_todolist;
  // const app_permit_done = requestdata.app_permit_done;

  // //`UPDATE user SET password = ?, email = ? WHERE username = ?`
  // const createnewappstatement = `UPDATE application SET app_description = ?, app_startdate = ?, app_enddate = ?, app_permit_create = ?, app_permit_open = ?, app_permit_todolist = ?,app_permit_doing = ?,app_permit_done = ? WHERE app_acronym = ?`;
  // // we perform the lower case conversion here because we know the variables are valid and will not crash because they dont exist
  // const createnewappparams = [app_description, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done, app_acronym];

  // try {
  //   await connection.beginTransaction();
  //   const [createnewappresult] = await connection.query(createnewappstatement, createnewappparams);
  //   console.log(createnewappresult);
  //   await connection.commit();
  //   res.status(200).json({
  //     success: true,
  //     message: "successfully updated App: " + app_acronym
  //   });
  //   return;
  // } catch (error) {
  //   console.log(error);
  //   await connection.rollback();
  //   res.status(500).json({
  //     success: true,
  //     message: "Could not update App: " + error
  //   });
  //   return;
  // } finally {
  //   connection.release();
  // }

  res.status(200).json({
    success: true,
    message: "successfully updated Task: "
  });
};

// GET
// /api/v1/task
exports.getTask = async (req, res, next) => {
  console.log("Get Task is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "getting task"
  });
};

// PUT
// /api/v1/task
exports.updateTask = async (req, res, next) => {
  console.log("Update Task is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
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
