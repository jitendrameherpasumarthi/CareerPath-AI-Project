const QuizResult = require("../models/QuizResult");

// ===============================
// Submit Quiz Result
// ===============================
const submitQuiz = async (req, res) => {
    try {
        const {
            topic,
            score,
            totalQuestions
        } = req.body;

        if (
            !topic ||
            score === undefined ||
            !totalQuestions
        ) {
            return res.status(400).json({
                success: false,
                message: "Quiz data is required"
            });
        }

        const percentage = Math.round(
            (score / totalQuestions) * 100
        );

        // Calculate attempt number for this user and topic
        const previousAttempts = await QuizResult.countDocuments({
            userId: req.userId,
            topic,
        });
        const attemptNumber = previousAttempts + 1;

        const result = await QuizResult.create({
            userId: req.userId,
            topic,
            attemptNumber,
            score,
            totalQuestions,
            correctAnswers: score,
            percentage,
            answers: Array.isArray(req.body.answers) ? req.body.answers : [],
            completedAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Quiz result saved successfully",
            result
        });

    } catch (error) {
        console.error("Quiz Result Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save quiz result"
        });
    }
};

// ===============================
// Get Quiz History
// ===============================
const getQuizHistory = async (req, res) => {
    try {
        const { topic } = req.query;
        const query = { userId: req.userId };
        if (topic && topic !== "All") {
            query.topic = topic;
        }

        const results = await QuizResult.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            totalAttempts: results.length,
            results: results.map((q) => ({
                _id: q._id,
                topic: q.topic,
                attemptNumber: q.attemptNumber || 1,
                score: q.score,
                totalQuestions: q.totalQuestions,
                correctAnswers: q.correctAnswers || q.score,
                percentage: q.percentage,
                completedAt: q.completedAt || q.createdAt,
                createdAt: q.createdAt,
            })),
            rawResults: results,
        });

    } catch (error) {
        console.error("Get Quiz History Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch quiz history"
        });
    }
};

// ===============================
// Get Quiz Results (Legacy / Dashboard)
// ===============================
const getQuizResults = async (req, res) => {
    try {
        const results = await QuizResult.find({
            userId: req.userId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            results
        });

    } catch (error) {
        console.error("Get Quiz Results Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch quiz results"
        });
    }
};

// ===============================
// Get Quiz Stats
// ===============================
const getQuizStats = async (req, res) => {
    try {
        const results = await QuizResult.find({ userId: req.userId }).sort({ createdAt: -1 });
        const totalQuizAttempts = results.length;

        if (totalQuizAttempts === 0) {
            return res.json({
                success: true,
                totalQuizAttempts: 0,
                averageScore: 0,
                bestScore: 0,
                latestScore: 0,
                topicStats: [],
            });
        }

        const scores = results.map((r) => r.percentage || 0);
        const sum = scores.reduce((a, b) => a + b, 0);
        const averageScore = Math.round((sum / totalQuizAttempts) * 10) / 10;
        const bestScore = Math.max(...scores);
        const latestScore = results[0].percentage || 0;

        // Group by topic
        const topicMap = {};
        for (const r of results) {
            if (!topicMap[r.topic]) {
                topicMap[r.topic] = { attempts: 0, scores: [] };
            }
            topicMap[r.topic].attempts += 1;
            topicMap[r.topic].scores.push(r.percentage || 0);
        }

        const topicStats = Object.keys(topicMap).map((topic) => {
            const tScores = topicMap[topic].scores;
            const tSum = tScores.reduce((a, b) => a + b, 0);
            return {
                topic,
                attempts: topicMap[topic].attempts,
                bestScore: Math.max(...tScores),
                averageScore: Math.round((tSum / tScores.length) * 10) / 10,
            };
        });

        res.json({
            success: true,
            totalQuizAttempts,
            averageScore,
            bestScore,
            latestScore,
            topicStats,
        });
    } catch (error) {
        console.error("Get Quiz Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate quiz stats",
        });
    }
};

// ===============================
// Export
// ===============================
module.exports = {
    submitQuiz,
    getQuizResults,
    getQuizHistory,
    getQuizStats,
};