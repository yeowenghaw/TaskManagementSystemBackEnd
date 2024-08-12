const express = require("express");
const router = express.Router();

const { verifyUser, verifyAdmin } = require("../utils/verification");

// importing controller methods form sampleCotroller
const { getUsers, createUser, getUser, updateUser, updateUserProfile, createGroup, getUserGroups, getGroups } = require("../controller/userController");
// groups
//const { createGroup, getUserGroups, getGroups } = require("../controller/groupController");

// middleware used for user verification, check if jwt is valid and user is not disablled
router.use(verifyUser);

// change below
router.route("/users/user").get(getUser);
router.route("/users/profile").put(updateUserProfile);

// admin group has an additional verification will apply to the below routes
router.route("/users").get(verifyAdmin, getUsers);
router.route("/users").post(verifyAdmin, createUser);
router.route("/users").put(verifyAdmin, updateUser);
router.route("/groups/usergroups").get(verifyAdmin, getUserGroups);
router.route("/groups").get(getGroups);
router.route("/groups").post(verifyAdmin, createGroup);

module.exports = router;
