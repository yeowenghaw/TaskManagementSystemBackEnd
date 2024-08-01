const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { getUsers, createUser, getUser, updateUser, updateUserProfile } = require("../controller/userController");

router.route("/users").get(getUsers);
router.route("/users/user/:username").get(getUser);
router.route("/users").post(createUser);
router.route("/users").put(updateUser);
router.route("/users/profile").put(updateUserProfile);

module.exports = router;
