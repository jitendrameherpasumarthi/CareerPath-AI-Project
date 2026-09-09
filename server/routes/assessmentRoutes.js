const express = require("express");

const {
    getQuestions,
    submitAssessment,
    getLatestAssessment,
    getAssessmentHistory,
    getAssessmentStats,
} = require("../controllers/assessmentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/questions", protect, getQuestions);
router.post("/submit", protect, submitAssessment);
router.get("/latest", protect, getLatestAssessment);
router.get("/history", protect, getAssessmentHistory);
router.get("/stats", protect, getAssessmentStats);

module.exports = router;