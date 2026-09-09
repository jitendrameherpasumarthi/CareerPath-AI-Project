const { computeLeaderboard, getUserRank } = require("../services/rankingService");

// ============================================================
// GET GLOBAL LEADERBOARD RANKINGS
// ============================================================
const getGlobalRankings = async (req, res) => {
    try {
        const { page = 1, limit = 20, role = "Student", search = "" } = req.query;

        const result = await computeLeaderboard({
            page,
            limit,
            role,
            searchQuery: search,
        });

        res.json({
            success: true,
            totalUsers: result.totalUsers,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            rankings: result.rankings,
        });
    } catch (error) {
        console.error("Get Global Rankings Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to compute global rankings",
        });
    }
};

// ============================================================
// GET LOGGED IN USER'S INDIVIDUAL RANK
// ============================================================
const getMyRanking = async (req, res) => {
    try {
        const myRankData = await getUserRank(req.userId);

        res.json({
            success: true,
            ...myRankData,
        });
    } catch (error) {
        console.error("Get My Ranking Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user rank",
        });
    }
};

module.exports = {
    getGlobalRankings,
    getMyRanking,
};
