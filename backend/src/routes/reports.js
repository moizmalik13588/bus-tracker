const express = require("express");
const router = express.Router();
const { submitReport, getReports } = require("../controllers/reportController");

router.post("/", submitReport);
router.get("/:stopId", getReports);

module.exports = router;
