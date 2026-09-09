const User = require("../models/User");
const Assessment = require("../models/Assessment");
const QuizResult = require("../models/QuizResult");
const CourseProgress = require("../models/CourseProgress");
const Certificate = require("../models/Certificate");

/**
 * Calculate user performance breakdown and score
 */
const calculateUserPerformance = async (userId) => {
    // 1. Valid Assessments
    const validAssessments = await Assessment.find({
        userId,
        $or: [
            { isValidForRanking: true },
            { assessmentStatus: "COMPLETED" },
        ],
    }).sort({ createdAt: 1 });

    const totalAssessmentAttempts = await Assessment.countDocuments({ userId });
    const validAssessmentAttempts = validAssessments.length;

    let bestAssessmentScore = 0;
    let firstAssessmentScore = 0;
    let improvementScore = 0;

    if (validAssessments.length > 0) {
        const scores = validAssessments.map((a) => a.totalScore || 0);
        bestAssessmentScore = Math.max(...scores);
        firstAssessmentScore = validAssessments[0].totalScore || 0;
        // Improvement: difference between first and best, normalized (e.g. +25 pts gain = 50 improvement score)
        const diff = Math.max(0, bestAssessmentScore - firstAssessmentScore);
        improvementScore = Math.min(100, Math.round(diff * 2));
    }

    // 2. Quiz Attempts
    const quizzes = await QuizResult.find({ userId });
    const quizAttempts = quizzes.length;
    let averageQuizScore = 0;
    let bestQuizScore = 0;

    if (quizAttempts > 0) {
        const quizScores = quizzes.map((q) => q.percentage || 0);
        const sum = quizScores.reduce((a, b) => a + b, 0);
        averageQuizScore = Math.round((sum / quizAttempts) * 10) / 10;
        bestQuizScore = Math.max(...quizScores);
    }

    // 3. Completed Courses
    const completedCoursesCount = await CourseProgress.countDocuments({
        userId,
        isCompleted: true,
    });
    // 0 = 0, 1 = 25, 2 = 50, 3 = 75, 4+ = 100
    const courseCompletionScore = Math.min(100, completedCoursesCount * 25);

    // 4. Certificates Count
    const certificatesCount = await Certificate.countDocuments({ userId, status: "ACTIVE" });

    // 5. Meaningful Activity Score (capped at 100)
    const activityRaw = (validAssessmentAttempts * 10) + (quizAttempts * 5) + (completedCoursesCount * 20);
    const activityScore = Math.min(100, activityRaw);

    // 6. Overall Performance Score Calculation
    // Formula:
    // (0.40 * BestAssessment) + (0.30 * AvgQuiz) + (0.15 * CourseCompletion) + (0.10 * Improvement) + (0.05 * Activity)
    const performanceScore = Math.round(
        (
            (0.40 * bestAssessmentScore) +
            (0.30 * averageQuizScore) +
            (0.15 * courseCompletionScore) +
            (0.10 * improvementScore) +
            (0.05 * activityScore)
        ) * 10
    ) / 10;

    return {
        userId,
        performanceScore,
        bestAssessmentScore,
        firstAssessmentScore,
        averageQuizScore,
        bestQuizScore,
        completedCourses: completedCoursesCount,
        certificatesCount,
        assessmentAttempts: totalAssessmentAttempts,
        validAssessmentAttempts,
        quizAttempts,
        breakdown: {
            bestAssessmentScore,
            averageQuizScore,
            courseCompletionScore,
            improvementScore,
            activityScore,
        },
    };
};

/**
 * Compute global leaderboard across all users
 */
const computeLeaderboard = async ({ role = "Student", page = 1, limit = 20, searchQuery = "" } = {}) => {
    // Filter users
    const query = {};
    if (role && role !== "All") {
        query.userType = role;
    }
    if (searchQuery) {
        query.name = { $regex: searchQuery, $options: "i" };
    }

    const users = await User.find(query).select("_id name email collegeName userType createdAt");

    // Calculate performance for all candidate users
    const performanceList = await Promise.all(
        users.map(async (u) => {
            const perf = await calculateUserPerformance(u._id);
            return {
                ...perf,
                userId: u._id,
                name: u.name,
                email: u.email,
                college: u.collegeName || "CareerPath AI Learner",
                userType: u.userType,
                createdAt: u.createdAt,
            };
        })
    );

    // Sort by performance score & tie-breakers
    performanceList.sort((a, b) => {
        if (b.performanceScore !== a.performanceScore) {
            return b.performanceScore - a.performanceScore;
        }
        if (b.bestAssessmentScore !== a.bestAssessmentScore) {
            return b.bestAssessmentScore - a.bestAssessmentScore;
        }
        if (b.averageQuizScore !== a.averageQuizScore) {
            return b.averageQuizScore - a.averageQuizScore;
        }
        if (b.completedCourses !== a.completedCourses) {
            return b.completedCourses - a.completedCourses;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Assign Competition / Standard Rank: 1, 2, 3...
    const rankedList = performanceList.map((item, index) => ({
        rank: index + 1,
        ...item,
    }));

    const totalUsers = rankedList.length;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedRankings = rankedList.slice(startIndex, startIndex + limitNum);

    return {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limitNum) || 1,
        currentPage: pageNum,
        rankings: paginatedRankings,
        allRanked: rankedList,
    };
};

/**
 * Get single user rank and percentile
 */
const getUserRank = async (userId) => {
    const { allRanked, totalUsers } = await computeLeaderboard({ role: "Student" });
    const userRankItem = allRanked.find((item) => item.userId.toString() === userId.toString());

    if (!userRankItem) {
        const perf = await calculateUserPerformance(userId);
        return {
            rank: totalUsers + 1,
            totalRankedUsers: totalUsers + 1,
            percentile: 0,
            ...perf,
        };
    }

    // Top X% percentile calculation
    const percentile = totalUsers > 0
        ? Math.max(1, Math.round(((totalUsers - userRankItem.rank + 1) / totalUsers) * 100))
        : 100;

    return {
        rank: userRankItem.rank,
        totalRankedUsers: totalUsers,
        percentile,
        performanceScore: userRankItem.performanceScore,
        breakdown: userRankItem.breakdown,
        completedCourses: userRankItem.completedCourses,
        certificatesCount: userRankItem.certificatesCount,
        assessmentAttempts: userRankItem.assessmentAttempts,
        quizAttempts: userRankItem.quizAttempts,
        bestAssessmentScore: userRankItem.bestAssessmentScore,
        averageQuizScore: userRankItem.averageQuizScore,
    };
};

module.exports = {
    calculateUserPerformance,
    computeLeaderboard,
    getUserRank,
};
