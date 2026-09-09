const express = require("express");

const {
    getRoadmap
} = require("../controllers/roadmapController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getRoadmap);

module.exports = router;