const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        // Face image captured during registration
        faceImage: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        // Student | Faculty | Individual
        userType: {
            type: String,
            enum: ["Student", "Faculty", "Individual"],
            required: true,
            default: "Student",
        },

        // ================= COLLEGE DETAILS =================

        collegeName: {
            type: String,
            default: "",
        },

        university: {
            type: String,
            default: "",
        },

        branch: {
            type: String,
            default: "",
        },

        // ================= STUDENT DETAILS =================

        yearOfStudy: {
            type: String,
            default: "",
        },

        rollNumber: {
            type: String,
            default: "",
        },

        collegeId: {
            type: String,
            default: "",
        },

        // ================= FACULTY DETAILS =================

        employeeId: {
            type: String,
            default: "",
        },

        designation: {
            type: String,
            default: "",
        },

        // ================= INDIVIDUAL DETAILS =================

        educationLevel: {
            type: String,
            default: "",
        },

        profession: {
            type: String,
            default: "",
        },

        careerGoal: {
            type: String,
            default: "",
        },

        occupation: {
            type: String,
            default: "",
        },

        organization: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);