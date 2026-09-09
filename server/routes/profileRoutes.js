const express = require("express");

const {
    getCurrentUser,
    createProfile,
    getProfile,
    updateProfile,
    getFacultyAnalytics,
} = require("../controllers/profileController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getCurrentUser);
router.get("/faculty/analytics", protect, getFacultyAnalytics);
router.post("/", protect, createProfile);
router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);

module.exports = router;