const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { getUsers, authenticateUsers } = require("../controller/userController");

router.route("/users").get(getUsers);
router.route("/users").post(authenticateUsers);

module.exports = router;
