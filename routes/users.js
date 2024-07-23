const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { getUsers, 
  authenticateUsers,
  createUser } = require("../controller/userController");

router.route("/users").get(getUsers);
router.route("/users").post(createUser);
router.route("/users/login").post(authenticateUsers);

module.exports = router;
