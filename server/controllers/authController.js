const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ============================================
// REGISTER
// ============================================

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,

            // Frontend currently sends role
            role,

            // Also support userType if sent
            userType,

            // Face image
            faceImage,

            // College details
            collegeName,
            university,
            branch,

            // Student details
            yearOfStudy,
            rollNumber,
            collegeId,

            // Faculty details
            employeeId,
            designation,

            // Individual details
            educationLevel,
            profession,
            careerGoal,
            occupation,
            organization,
        } = req.body;


        // ============================================
        // CONVERT FRONTEND ROLE TO BACKEND USER TYPE
        // ============================================

        let finalUserType = userType;

        if (!finalUserType && role) {

            if (role.toLowerCase() === "student") {
                finalUserType = "Student";
            }

            else if (role.toLowerCase() === "faculty") {
                finalUserType = "Faculty";
            }

            else if (role.toLowerCase() === "individual") {
                finalUserType = "Individual";
            }
        }


        // ============================================
        // BASIC VALIDATION
        // ============================================

        if (!name || !email || !password || !finalUserType) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and user type are required",
            });
        }


        // ============================================
        // FACE VALIDATION
        // ============================================

        if (!faceImage) {
            return res.status(400).json({
                success: false,
                message:
                    "Please scan and capture your face before registration",
            });
        }


        // ============================================
        // CHECK EXISTING USER
        // ============================================

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }


        // ============================================
        // HASH PASSWORD
        // ============================================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // ============================================
        // CREATE USER
        // ============================================

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,

            phone,
            userType: finalUserType,

            // Face registration image
            faceImage,

            // College details
            collegeName,
            university,
            branch,

            // Student details
            yearOfStudy,
            rollNumber,
            collegeId,

            // Faculty details
            employeeId,
            designation,

            // Individual details
            educationLevel,
            profession,
            careerGoal,
            occupation,
            organization,
        });

        if (finalUserType === "Student") {
            await StudentProfile.create({
                userId: user._id,
                degree: collegeName || "Student",
                branch: branch || "General",
                year: Number.parseInt(yearOfStudy, 10) || 1,
                careerGoal: careerGoal || "Software Developer",
                interests: ["Python", "JavaScript", "DSA"],
            });
        }


        // ============================================
        // CREATE JWT TOKEN
        // ============================================

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(201).json({
            success: true,
            message:
                "Registration successful! Face has been registered successfully.",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                careerGoal: user.careerGoal,
            },
        });

    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};


// ============================================
// LOGIN
// ============================================

const login = async (req, res) => {
    try {

        const {
            email,
            password,
        } = req.body;


        // ============================================
        // VALIDATION
        // ============================================

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }


        // ============================================
        // FIND USER
        // ============================================

        const user = await User.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }


        // ============================================
        // CHECK PASSWORD
        // ============================================

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }


        // ============================================
        // CREATE TOKEN
        // ============================================

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );


        // ============================================
        // SUCCESS RESPONSE
        // ============================================

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                careerGoal: user.careerGoal,

                // Used later to know whether face
                // registration exists
                faceRegistered: Boolean(user.faceImage),
            },
        });

    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential || !process.env.GOOGLE_CLIENT_ID) {
            return res.status(400).json({
                success: false,
                message: "Google authentication is not configured",
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email.toLowerCase();

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name: payload.name || email.split("@")[0],
                email,
                password: await bcrypt.hash(jwt.sign({ email }, process.env.JWT_SECRET), 10),
                userType: "Individual",
            });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                careerGoal: user.careerGoal,
            },
        });
    } catch (error) {
        console.error("Google Login Error:", error);
        return res.status(401).json({
            success: false,
            message: "Unable to verify Google account",
        });
    }
};

module.exports = {
    register,
    login,
    googleLogin,
};