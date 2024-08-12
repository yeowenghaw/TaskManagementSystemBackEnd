const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { authenticateUser, logoutUser, checkUser, checkAdmin, checkProjectLead } = require("../controller/authController");
const { verifyUser, verifyAdmin, verifyProjectLead } = require("../utils/verification");

//
router.route("/auth/login").post(authenticateUser);
router.route("/auth/logout").post(logoutUser);

router.use(verifyUser);
router.route("/auth/user").get(checkUser);
router.route("/auth/admin").get(verifyAdmin, checkAdmin);
router.route("/auth/projectlead").get(verifyProjectLead, checkProjectLead);

module.exports = router;
