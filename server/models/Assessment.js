const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        scores: {
            Python:     { type: Number, default: 0 },
            JavaScript: { type: Number, default: 0 },
            DSA:        { type: Number, default: 0 },
        },

        totalScore: {
            type: Number,
            default: 0,
        },

        answers: [
            {
                questionId:     { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
                questionText:   String,
                skill:          String,
                selectedAnswer: String,
                correctAnswer:  String,
                isCorrect:      Boolean,
            },
        ],

        // ── Proctoring / Security ─────────────────────────────────────────────
        securityEvents: [
            {
                type:       { type: String },
                device:     { type: String, default: "" },
                confidence: { type: Number, default: 0 },
                timestamp:  { type: Date, default: Date.now },
                details:    { type: String, default: "" },
            },
        ],

        assessmentStatus: {
            type: String,
            enum: ["COMPLETED", "AUTO_SUBMITTED_SECURITY_EVENT"],
            default: "COMPLETED",
        },

        autoSubmitReason: {
            type: String,
            default: "",
        },

        attemptNumber: {
            type: Number,
            default: 1,
        },

        startedAt: {
            type: Date,
            default: Date.now,
        },

        submittedAt: {
            type: Date,
            default: Date.now,
        },

        timeTaken: {
            type: Number, // in seconds
            default: 0,
        },

        isValidForRanking: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Indexes for fast history retrieval and ranking queries
assessmentSchema.index({ userId: 1, createdAt: -1 });
assessmentSchema.index({ userId: 1, totalScore: -1 });
assessmentSchema.index({ userId: 1, attemptNumber: 1 });
assessmentSchema.index({ isValidForRanking: 1 });

module.exports = mongoose.model("Assessment", assessmentSchema);