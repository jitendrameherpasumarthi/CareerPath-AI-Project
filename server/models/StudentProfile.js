const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        degree: {
            type: String,
            required: true
        },

        branch: {
            type: String,
            required: true
        },

        year: {
            type: Number,
            required: true
        },

        careerGoal: {
            type: String,
            required: true
        },

        programmingLanguages: {
            type: [String],
            default: []
        },

        dsaLevel: {
            type: String,
            default: "Beginner"
        },

        interests: {
            type: [String],
            default: []
        },

        learningHoursPerDay: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "StudentProfile",
    studentProfileSchema
);