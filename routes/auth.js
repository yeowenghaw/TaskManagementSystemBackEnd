const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { authenticateUser, logoutUser, checkAuthentication } = require("../controller/authController");

router.route("/auth/login").post(authenticateUser);
router.route("/auth/logout").post(logoutUser);
router.route("/auth/authenticate").post(checkAuthentication);

module.exports = router;
