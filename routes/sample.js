const express = require("express");
const router = express.Router();

// importing controller methods form sampleCotroller
const { getSample } = require("../controller/sampleController");

router.route('/sample').get(getSample);

module.exports = router;
