const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { authenticateUser, logoutUser, checkUser, checkAdmin } = require("../controller/authController");
const { verifyUser, verifyAdmin } = require("../utils/verification");

//
router.route("/auth/login").post(authenticateUser);
router.route("/auth/logout").post(logoutUser);

router.use(verifyUser);
router.route("/auth/user").post(checkUser);

//router.use(verifyAdmin);
router.route("/auth/admin").post(verifyAdmin, checkAdmin);

module.exports = router;
