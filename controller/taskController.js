const { getConnectionPool } = require("../config/database");

// POST
// /api/v1/App
exports.createApp = async (req, res, next) => {
  console.log("Create App is called!");
  const pool = await getConnectionPool();
  let errorstring = "";

  const requestdata = await req.body;
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

  console.log("app_acronym: " + app_acronym);
  console.log("app_description: " + app_description);
  console.log("app_rnumber: " + app_rnumber);
  console.log("app_startdate: " + app_startdate);
  console.log("app_enddate: " + app_enddate);
  console.log("app_permit_create: " + app_permit_create);
  console.log("app_permit_open: " + app_permit_open);
  console.log("app_permit_todolist: " + app_permit_todolist);
  console.log("app_permit_doing: " + app_permit_doing);
  console.log("app_permit_done: " + app_permit_done);

  res.status(200).json({
    success: true,
    message: "creating App"
  });
};

// GET
// /api/v1/App
exports.getApp = async (req, res, next) => {
  console.log("Get App is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "getting App"
  });
};

// PUT
// /api/v1/App
exports.updateApp = async (req, res, next) => {
  console.log("Update App is called!");
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "updating App"
  });
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
  const pool = await getConnectionPool();
  let errorstring = "";
  res.status(200).json({
    success: true,
    message: "creating task"
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
