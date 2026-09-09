const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        courseId: {
            type: String,
            required: true,
            trim: true,
        },

        courseName: {
            type: String,
            required: true,
            trim: true,
        },

        certificateId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        verificationCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        issuedAt: {
            type: Date,
            default: Date.now,
        },

        completionDate: {
            type: Date,
            default: Date.now,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "REVOKED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

// One certificate per user per course
certificateSchema.index(
    { userId: 1, courseId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
