const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { authenticateUser, logoutUser, checkAuthentication } = require("../controller/authController");

router.route("/login").post(authenticateUser);
router.route("/logout").post(logoutUser);
router.route("/authenticate").post(checkAuthentication);

module.exports = router;
