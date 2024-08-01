const express = require("express");
const router = express.Router();

// // importing controller methods form sampleCotroller
// const { getUsers, authenticateUsers, createUser, updateUserEmail, updateUserPassword, logoutUsers, getUser } = require("../controller/userController");

const { createGroup, getUserGroups, getGroups } = require("../controller/groupController");

router.route("/usergroups").get(getUserGroups);
router.route("/groups").get(getGroups);
// router.route("/users/user/:username").get(getUser);
router.route("/groups").post(createGroup);
// router.route("/users/login").post(authenticateUsers);
// router.route("/users/logout").post(logoutUsers);
// router.route("/users/email").put(updateUserEmail);
// router.route("/users/password").put(updateUserPassword);

module.exports = router;
