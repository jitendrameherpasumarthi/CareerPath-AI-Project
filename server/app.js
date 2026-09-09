const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const quizRoutes = require("./routes/quizRoutes");
const courseProgressRoutes = require("./routes/courseProgressRoutes");
const chatRoutes           = require("./routes/chatRoutes");
const rankingRoutes        = require("./routes/rankingRoutes");
const certificateRoutes    = require("./routes/certificateRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/course-progress", courseProgressRoutes);
app.use("/api/chat",           chatRoutes);
app.use("/api/rankings",       rankingRoutes);
app.use("/api/certificates",   certificateRoutes);

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        project: "CareerPath AI",
        message: "Backend is running successfully!"
    });
});

module.exports = app;