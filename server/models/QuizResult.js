const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        topic: {
            type: String,
            required: true
        },

        score: {
            type: Number,
            required: true
        },

        totalQuestions: {
            type: Number,
            required: true
        },

        percentage: {
            type: Number,
            required: true
        },

        attemptNumber: {
            type: Number,
            default: 1
        },

        correctAnswers: {
            type: Number,
            default: 0
        },

        answers: {
            type: Array,
            default: []
        },

        completedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Indexes for fast history and stats retrieval
quizResultSchema.index({ userId: 1, createdAt: -1 });
quizResultSchema.index({ userId: 1, topic: 1, createdAt: -1 });
quizResultSchema.index({ userId: 1, percentage: -1 });

module.exports = mongoose.model("QuizResult", quizResultSchema);