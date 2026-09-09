const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const Assessment = require("../models/Assessment");
const QuizResult = require("../models/QuizResult");
const CourseProgress = require("../models/CourseProgress");
const Certificate = require("../models/Certificate");
const { computeLeaderboard } = require("../services/rankingService");

// GET CURRENT AUTHENTICATED USER
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const profile = await StudentProfile.findOne({ userId: req.userId });

        res.json({
            success: true,
            user,
            profile: profile || null,
        });
    } catch (error) {
        console.error("Get Current User Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user data",
        });
    }
};

// CREATE PROFILE
const createProfile = async (req, res) => {
    try {
        const {
            degree,
            branch,
            year,
            careerGoal,
            programmingLanguages,
            dsaLevel,
            interests,
            learningHoursPerDay,
        } = req.body;

        const existingProfile = await StudentProfile.findOne({
            userId: req.userId,
        });

        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: "Profile already exists",
            });
        }

        const profile = await StudentProfile.create({
            userId: req.userId,
            degree: degree || "B.Tech",
            branch: branch || "Computer Science",
            year: Number(year) || 1,
            careerGoal: careerGoal || "Software Developer",
            programmingLanguages: programmingLanguages || ["Python", "JavaScript"],
            dsaLevel: dsaLevel || "Beginner",
            interests: interests || ["Web Development", "AI/ML"],
            learningHoursPerDay: Number(learningHoursPerDay) || 2,
        });

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            profile,
        });
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create profile",
        });
    }
};

// GET PROFILE
const getProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({
            userId: req.userId,
        });

        const user = await User.findById(req.userId).select("-password");

        res.json({
            success: true,
            profile: profile || {
                degree: user?.collegeName || "Undergraduate",
                branch: user?.branch || "Computer Science & Engineering",
                year: user?.yearOfStudy || "1",
                careerGoal: user?.careerGoal || "Software Developer",
                interests: ["Python", "JavaScript", "DSA"],
            },
            user,
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student profile",
        });
    }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOneAndUpdate(
            { userId: req.userId },
            { ...req.body, userId: req.userId },
            { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (req.body.name || req.body.phone || req.body.careerGoal) {
            await User.findByIdAndUpdate(req.userId, {
                name: req.body.name,
                phone: req.body.phone,
                careerGoal: req.body.careerGoal,
            });
        }

        res.json({ success: true, message: "Profile updated successfully", profile });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(400).json({ success: false, message: "Failed to update profile" });
    }
};

// FACULTY ANALYTICS (Total Students, Assessment Averages, Skill Gaps, Recent Submissions)
const getFacultyAnalytics = async (req, res) => {
    try {
        const students = await User.find({ userType: "Student" }).select(
            "name email branch collegeName yearOfStudy rollNumber createdAt"
        );

        const totalStudents = students.length;
        const studentIds = students.map((s) => s._id);

        const assessments = await Assessment.find({ userId: { $in: studentIds } })
            .populate("userId", "name email branch rollNumber")
            .sort({ createdAt: -1 });

        let pythonTotal = 0;
        let jsTotal = 0;
        let dsaTotal = 0;
        let scoreTotal = 0;
        let evaluatedCount = 0;

        for (const ass of assessments) {
            if (ass.scores) {
                pythonTotal += ass.scores.Python ?? 0;
                jsTotal += ass.scores.JavaScript ?? 0;
                dsaTotal += ass.scores.DSA ?? 0;
                scoreTotal += ass.totalScore ?? 0;
                evaluatedCount++;
            }
        }

        const avgScore = evaluatedCount > 0 ? Math.round(scoreTotal / evaluatedCount) : 0;
        const avgPython = evaluatedCount > 0 ? Math.round(pythonTotal / evaluatedCount) : 0;
        const avgJS = evaluatedCount > 0 ? Math.round(jsTotal / evaluatedCount) : 0;
        const avgDSA = evaluatedCount > 0 ? Math.round(dsaTotal / evaluatedCount) : 0;

        const commonGaps = [
            {
                skill: "Python",
                averageScore: avgPython,
                status: avgPython < 50 ? "High Need" : avgPython < 75 ? "Moderate Need" : "Proficient",
            },
            {
                skill: "JavaScript",
                averageScore: avgJS,
                status: avgJS < 50 ? "High Need" : avgJS < 75 ? "Moderate Need" : "Proficient",
            },
            {
                skill: "Data Structures & Algorithms",
                averageScore: avgDSA,
                status: avgDSA < 50 ? "High Need" : avgDSA < 75 ? "Moderate Need" : "Proficient",
            },
        ];

        // Additional Metrics: Quizzes, Completed Courses, Certificates
        const [quizCount, completedCoursesCount, certificatesCount, leaderboardData] = await Promise.all([
            QuizResult.countDocuments({ userId: { $in: studentIds } }),
            CourseProgress.countDocuments({ userId: { $in: studentIds }, isCompleted: true }),
            Certificate.countDocuments({ userId: { $in: studentIds }, status: "ACTIVE" }),
            computeLeaderboard({ role: "Student", limit: 10 }),
        ]);

        const quizzes = await QuizResult.find({ userId: { $in: studentIds } }).select("percentage");
        const avgQuizScore = quizzes.length > 0
            ? Math.round((quizzes.reduce((acc, q) => acc + (q.percentage || 0), 0) / quizzes.length) * 10) / 10
            : 0;

        res.json({
            success: true,
            analytics: {
                totalStudents,
                totalAssessmentsCompleted: assessments.length,
                totalQuizAttempts: quizCount,
                completedCourses: completedCoursesCount,
                certificatesIssued: certificatesCount,
                averageClassScore: avgScore,
                averageQuizScore: avgQuizScore,
                skillAverages: {
                    Python: avgPython,
                    JavaScript: avgJS,
                    DSA: avgDSA,
                },
                commonGaps,
                topStudents: leaderboardData.rankings.slice(0, 10),
                recentAssessments: assessments.slice(0, 10).map((a) => ({
                    id: a._id,
                    studentName: a.userId?.name || "Student",
                    studentEmail: a.userId?.email || "",
                    studentRoll: a.userId?.rollNumber || "N/A",
                    totalScore: a.totalScore,
                    scores: a.scores,
                    date: a.createdAt,
                    assessmentStatus: a.assessmentStatus,
                })),
                studentsList: students.map((s) => ({
                    id: s._id,
                    name: s.name,
                    email: s.email,
                    branch: s.branch,
                    rollNumber: s.rollNumber,
                    college: s.collegeName,
                    year: s.yearOfStudy,
                })),
            },
        });
    } catch (error) {
        console.error("Faculty Analytics Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate faculty analytics",
        });
    }
};

module.exports = {
    getCurrentUser,
    createProfile,
    getProfile,
    updateProfile,
    getFacultyAnalytics,
};