const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const app = express();

// Trust reverse proxy for HTTPS deployments (Render, Railway, Heroku, AWS, etc.)
app.set("trust proxy", 1);

// Allowed origins configuration
const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "https://jitendrameherpasumarthi.github.io",
];

const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.replace(/\/+$/, "");
        const isAllowed = allowedOrigins.some((allowed) => {
            const cleanAllowed = allowed.replace(/\/+$/, "");
            return (
                normalizedOrigin === cleanAllowed ||
                normalizedOrigin.startsWith(cleanAllowed)
            );
        });

        if (isAllowed || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }

        return callback(new Error(`CORS policy blocked access from origin ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect MongoDB
connectDB();

// Root health check endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        project: "CareerPath AI",
        message: "CareerPath AI Backend API is running.",
        version: "1.0.0",
    });
});

// Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const quizRoutes = require("./routes/quizRoutes");
const courseProgressRoutes = require("./routes/courseProgressRoutes");
const chatRoutes = require("./routes/chatRoutes");
const rankingRoutes = require("./routes/rankingRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/course-progress", courseProgressRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/certificates", certificateRoutes);

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        project: "CareerPath AI",
        message: "Backend is running successfully!",
    });
});

// Global 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found on this server.`,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

module.exports = app;