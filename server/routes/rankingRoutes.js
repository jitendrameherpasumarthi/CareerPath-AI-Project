const express = require("express");
const { getGlobalRankings, getMyRanking } = require("../controllers/rankingController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Public / Protected rankings
router.get("/", protect, getGlobalRankings);
router.get("/me", protect, getMyRanking);

module.exports = router;
