const express = require("express");
const router = express.Router();

const { getSample } = require("../controller/sampleController");

router.route('/sample').get(getSample);

module.exports = router;
