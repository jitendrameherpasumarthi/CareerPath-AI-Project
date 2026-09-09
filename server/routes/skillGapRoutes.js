const express = require("express");

const {
    getSkillGap
} = require("../controllers/skillGapController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getSkillGap);

module.exports = router;