const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { getUsers } = require("../controller/userController");

router.route('/users').get(getUsers);

module.exports = router;
