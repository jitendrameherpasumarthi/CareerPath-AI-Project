const express = require("express");

const {
    submitQuiz,
    getQuizResults,
    getQuizHistory,
    getQuizStats,
} = require("../controllers/quizController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/result", protect, submitQuiz);
router.post("/submit", protect, submitQuiz);
router.get("/results", protect, getQuizResults);
router.get("/history", protect, getQuizHistory);
router.get("/stats", protect, getQuizStats);

module.exports = router;