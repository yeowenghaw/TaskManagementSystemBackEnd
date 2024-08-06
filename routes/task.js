const express = require("express");
const router = express.Router();

// const { verifyUser, verifyAdmin } = require("../utils/verification");

// // importing controller methods form sampleCotroller
const { createApp, getApp, updateApp, createPlan, getPlan, updatePlan, createTask, getTask, updateTask, createNote, getNote, updateNote } = require("../controller/taskController");
// // groups
// //const { createGroup, getUserGroups, getGroups } = require("../controller/groupController");

// // middleware used for user verification, check if jwt is valid and user is not disablled
// router.use(verifyUser);

router.route("/app").post(createApp);
router.route("/app").get(getApp);
router.route("/app").put(updateApp);

router.route("/plan").post(createPlan);
router.route("/plan").get(getPlan);
router.route("/plan").put(updatePlan);

router.route("/task").post(createTask);
router.route("/task").get(getTask);
router.route("/task").put(updateTask);

router.route("/note").post(createNote);
router.route("/note").get(getNote);
router.route("/note").put(updateNote);
// router.route("/users/profile").put(updateUserProfile);

// // admin group has an additional verification will apply to the below routes
// router.route("/users").get(verifyAdmin, getUsers);
// router.route("/users").post(verifyAdmin, createUser);
// router.route("/users").put(verifyAdmin, updateUser);
// router.route("/groups/usergroups").get(verifyAdmin, getUserGroups);
// router.route("/groups").get(verifyAdmin, getGroups);
// router.route("/groups").post(verifyAdmin, createGroup);

module.exports = router;
