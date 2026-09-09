const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        courseId: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            default: "📘",
        },
        description: {
            type: String,
            required: true,
        },
        level: {
            type: String,
            default: "Beginner → Intermediate",
        },
        duration: {
            type: String,
            default: "6 Weeks",
        },
        priority: {
            type: String,
            default: "Medium Priority",
        },
        lessonsCount: {
            type: Number,
            default: 5,
        },
        quizzesCount: {
            type: Number,
            default: 2,
        },
        topics: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Course", courseSchema);
