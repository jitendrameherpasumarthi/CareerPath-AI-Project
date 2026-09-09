const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        courseId: {
            type: String,
            required: true,
        },

        completedLessons: {
            type: [String],
            default: [],
        },

        lastLesson: {
            type: String,
            default: "",
        },

        percentage: {
            type: Number,
            default: 0,
        },

        isCompleted: {
            type: Boolean,
            default: false,
        },

        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// One progress document per user per course
courseProgressSchema.index(
    { userId: 1, courseId: 1 },
    { unique: true }
);
courseProgressSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model(
    "CourseProgress",
    courseProgressSchema
);
