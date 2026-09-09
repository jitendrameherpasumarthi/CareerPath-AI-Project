const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const { issueCertificate } = require("../services/certificateService");

// MARK A LESSON AS COMPLETE
const completeLesson = async (req, res) => {
    try {
        const { courseId, lesson } = req.body;

        if (!courseId || !lesson) {
            return res.status(400).json({
                success: false,
                message: "Course ID and lesson are required",
            });
        }

        // Fetch course info to know total lessons
        const course = await Course.findOne({ courseId });
        const totalLessons = course?.lessonsCount || 5;

        let progress = await CourseProgress.findOne({
            userId: req.userId,
            courseId,
        });

        if (!progress) {
            progress = await CourseProgress.create({
                userId: req.userId,
                courseId,
                completedLessons: [lesson],
                lastLesson: lesson,
                percentage: Math.round((1 / totalLessons) * 100),
                isCompleted: 1 >= totalLessons,
                completedAt: 1 >= totalLessons ? new Date() : undefined,
            });
        } else {
            if (!progress.completedLessons.includes(lesson)) {
                progress.completedLessons.push(lesson);
            }
            progress.lastLesson = lesson;
            progress.percentage = Math.min(100, Math.round((progress.completedLessons.length / totalLessons) * 100));

            if (progress.completedLessons.length >= totalLessons) {
                progress.isCompleted = true;
                if (!progress.completedAt) {
                    progress.completedAt = new Date();
                }
            }
            await progress.save();
        }

        let certificate = null;
        if (progress.isCompleted) {
            try {
                certificate = await issueCertificate(req.userId, courseId, course?.title);
            } catch (certErr) {
                console.error("Certificate auto-issuance error:", certErr);
            }
        }

        res.json({
            success: true,
            message: progress.isCompleted
                ? "Course completed! Certificate generated."
                : "Lesson marked as complete",
            progress,
            isCompleted: progress.isCompleted,
            certificate,
        });
    } catch (error) {
        console.error("Course Progress Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update course progress",
        });
    }
};

// GET COURSE PROGRESS FOR A SPECIFIC COURSE
const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;

        const progress = await CourseProgress.findOne({
            userId: req.userId,
            courseId,
        });

        if (!progress) {
            return res.json({
                success: true,
                progress: {
                    courseId,
                    completedLessons: [],
                    lastLesson: "",
                },
            });
        }

        res.json({
            success: true,
            progress,
        });
    } catch (error) {
        console.error("Get Course Progress Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get course progress",
        });
    }
};

// GET ALL COURSE PROGRESS FOR CURRENT USER
const getAllUserProgress = async (req, res) => {
    try {
        const progresses = await CourseProgress.find({ userId: req.userId });
        const courses = await Course.find();

        const progressMap = {};
        for (const prog of progresses) {
            progressMap[prog.courseId] = {
                completedLessons: prog.completedLessons,
                lastLesson: prog.lastLesson,
                completedCount: prog.completedLessons.length,
            };
        }

        res.json({
            success: true,
            progress: progressMap,
            courses,
        });
    } catch (error) {
        console.error("Get All Progress Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get overall user progress",
        });
    }
};

// GET ALL COURSES
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json({
            success: true,
            courses,
        });
    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get courses catalog",
        });
    }
};

module.exports = {
    completeLesson,
    getCourseProgress,
    getAllUserProgress,
    getCourses,
};