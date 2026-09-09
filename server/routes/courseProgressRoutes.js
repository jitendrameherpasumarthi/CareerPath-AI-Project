const express = require("express");

const {
    completeLesson,
    getCourseProgress,
    getAllUserProgress,
    getCourses,
} = require("../controllers/courseProgressController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/complete", protect, completeLesson);
router.get("/all", protect, getAllUserProgress);
router.get("/catalog", protect, getCourses);
router.get("/:courseId", protect, getCourseProgress);

module.exports = router;