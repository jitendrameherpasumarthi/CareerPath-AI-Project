import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaTrophy,
    FaMedal,
    FaCrown,
    FaSearch,
    FaArrowLeft,
    FaArrowRight,
    FaUserGraduate,
    FaFire,
    FaCertificate,
    FaExclamationTriangle,
    FaRedo,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Leaderboard.css";

function Leaderboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const storedUser = localStorage.getItem("user");
    let currentUserId = null;
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            currentUserId = parsed._id || parsed.id;
        } catch {
            // ignore
        }
    }

    const fetchLeaderboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [rankingsRes, myRankRes] = await Promise.allSettled([
                api.get(`/rankings?page=${currentPage}&limit=20&search=${encodeURIComponent(searchQuery)}`),
                api.get("/rankings/me"),
            ]);

            if (rankingsRes.status === "fulfilled" && rankingsRes.value.data?.success) {
                setRankings(rankingsRes.value.data.rankings || []);
                setTotalPages(rankingsRes.value.data.totalPages || 1);
                setTotalUsers(rankingsRes.value.data.totalUsers || 0);
            } else if (rankingsRes.status === "rejected") {
                console.error("Leaderboard API error:", rankingsRes.reason);
                setError(rankingsRes.reason?.response?.data?.message || "Failed to load leaderboard rankings.");
            }

            if (myRankRes.status === "fulfilled" && myRankRes.value.data?.success) {
                setMyRank(myRankRes.value.data);
            }
        } catch (err) {
            console.error("Fetch leaderboard unexpected error:", err);
            setError("An unexpected error occurred while calculating rankings.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        fetchLeaderboardData();
    }, [fetchLeaderboardData]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchLeaderboardData();
    };

    // Top 3 for Podium
    const topThree = rankings.slice(0, 3);
    const rank1 = topThree[0];
    const rank2 = topThree[1];
    const rank3 = topThree[2];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <Navbar />

                <div className="leaderboard-page-container">
                    {/* Header */}
                    <div className="leaderboard-hero-card">
                        <div className="leaderboard-hero-content">
                            <button className="btn-back-link" onClick={() => navigate("/student/dashboard")}>
                                <FaArrowLeft /> Back to Dashboard
                            </button>
                            <h1><FaTrophy className="trophy-icon-gold" /> Global Learner Leaderboard</h1>
                            <p>
                                Fair and explainable performance rankings driven by diagnostic assessments (40%),
                                quiz accuracy (30%), completed courses (15%), skill improvement (10%), and verified activity (5%).
                            </p>
                        </div>

                        {myRank && (
                            <div className="my-rank-highlight-box">
                                <span className="my-rank-title"><FaFire /> Your Platform Standing</span>
                                <div className="my-rank-digits">
                                    <strong>#{myRank.rank || "--"}</strong>
                                    <span>/ {myRank.totalRankedUsers || totalUsers} Learners</span>
                                </div>
                                <div className="my-rank-score-pill">
                                    <span>Score: <strong>{myRank.performanceScore ?? "--"}</strong></span>
                                    <span className="percentile-tag">Top {myRank.percentile || 100}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Podium for Top 3 (on first page and when no search query) */}
                    {currentPage === 1 && !searchQuery && topThree.length > 0 && (
                        <div className="leaderboard-podium-section">
                            {/* Rank 2 - Silver */}
                            {rank2 && (
                                <div className="podium-card silver">
                                    <div className="podium-rank-badge silver-badge">
                                        <FaMedal /> #2
                                    </div>
                                    <div className="podium-avatar silver-ring">
                                        <FaUserGraduate />
                                    </div>
                                    <h3 className="podium-name">{rank2.name || "Learner"}</h3>
                                    <span className="podium-college">{rank2.college || "CareerPath AI"}</span>
                                    <div className="podium-score-box">
                                        <strong>{rank2.performanceScore ?? 0}</strong>
                                        <span>Perf Score</span>
                                    </div>
                                </div>
                            )}

                            {/* Rank 1 - Gold */}
                            {rank1 && (
                                <div className="podium-card gold champion">
                                    <div className="crown-icon-box"><FaCrown /></div>
                                    <div className="podium-rank-badge gold-badge">
                                        <FaTrophy /> #1
                                    </div>
                                    <div className="podium-avatar gold-ring">
                                        <FaUserGraduate />
                                    </div>
                                    <h3 className="podium-name">{rank1.name || "Learner"}</h3>
                                    <span className="podium-college">{rank1.college || "CareerPath AI"}</span>
                                    <div className="podium-score-box gold-bg">
                                        <strong>{rank1.performanceScore ?? 0}</strong>
                                        <span>Performance Score</span>
                                    </div>
                                </div>
                            )}

                            {/* Rank 3 - Bronze */}
                            {rank3 && (
                                <div className="podium-card bronze">
                                    <div className="podium-rank-badge bronze-badge">
                                        <FaMedal /> #3
                                    </div>
                                    <div className="podium-avatar bronze-ring">
                                        <FaUserGraduate />
                                    </div>
                                    <h3 className="podium-name">{rank3.name || "Learner"}</h3>
                                    <span className="podium-college">{rank3.college || "CareerPath AI"}</span>
                                    <div className="podium-score-box">
                                        <strong>{rank3.performanceScore ?? 0}</strong>
                                        <span>Perf Score</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search & Filter Bar */}
                    <div className="leaderboard-search-bar">
                        <form onSubmit={handleSearchSubmit} className="search-form-flex">
                            <div className="search-input-wrap">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search student by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn-secondary search-btn">
                                Search
                            </button>
                        </form>
                        <div className="total-students-indicator">
                            Showing <strong>{rankings.length}</strong> of <strong>{totalUsers}</strong> Ranked Students
                        </div>
                    </div>

                    {/* State Handlers: Loading / Error / Empty / Data */}
                    {loading ? (
                        <LoadingSpinner message="Calculating global rankings..." />
                    ) : error ? (
                        <div className="empty-leaderboard-card">
                            <FaExclamationTriangle style={{ fontSize: "3rem", color: "#fb7185", marginBottom: "8px" }} />
                            <h3 style={{ color: "#fb7185" }}>Unable to Load Leaderboard</h3>
                            <p>{error}</p>
                            <button className="btn-secondary" onClick={fetchLeaderboardData}>
                                <FaRedo /> Try Again
                            </button>
                        </div>
                    ) : rankings.length === 0 ? (
                        <div className="empty-leaderboard-card">
                            <FaTrophy className="empty-icon" />
                            <h3>No Students Found</h3>
                            <p>Try adjusting your search criteria or check back later.</p>
                        </div>
                    ) : (
                        <div className="leaderboard-table-card">
                            <table className="leaderboard-custom-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Student</th>
                                        <th>Performance Score</th>
                                        <th>Best Assessment</th>
                                        <th>Avg Quiz</th>
                                        <th>Courses Completed</th>
                                        <th>Attempts (Ass / Qz)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankings.map((r) => {
                                        const rUserId = r.userId?._id || r.userId;
                                        const isCurrentUser = currentUserId && rUserId && (rUserId.toString() === currentUserId.toString());
                                        return (
                                            <tr key={rUserId || r.rank} className={`rank-table-row ${isCurrentUser ? "current-user-row" : ""}`}>
                                                <td className="rank-cell">
                                                    {r.rank === 1 ? (
                                                        <span className="rank-badge-icon gold"><FaCrown /> 1</span>
                                                    ) : r.rank === 2 ? (
                                                        <span className="rank-badge-icon silver"><FaMedal /> 2</span>
                                                    ) : r.rank === 3 ? (
                                                        <span className="rank-badge-icon bronze"><FaMedal /> 3</span>
                                                    ) : (
                                                        <span className="rank-num">#{r.rank}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="student-profile-cell">
                                                        <div className="student-avatar-letter">
                                                            {r.name?.charAt(0)?.toUpperCase() || "S"}
                                                        </div>
                                                        <div>
                                                            <strong className="student-name-text">
                                                                {r.name || "Student"} {isCurrentUser && <span className="you-pill">YOU</span>}
                                                            </strong>
                                                            <span className="student-college-text">{r.college || "CareerPath AI"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="perf-score-display">
                                                        <strong>{r.performanceScore ?? 0}</strong>
                                                        <div className="score-mini-bar">
                                                            <div className="score-mini-fill" style={{ width: `${Math.min(100, r.performanceScore || 0)}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="metric-pill assessment-metric">
                                                        {r.bestAssessmentScore > 0 ? `${r.bestAssessmentScore}%` : "--"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="metric-pill quiz-metric">
                                                        {r.averageQuizScore > 0 ? `${r.averageQuizScore}%` : "--"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="courses-badge">
                                                        <FaCertificate style={{ marginRight: 4 }} /> {r.completedCourses ?? 0}
                                                    </span>
                                                </td>
                                                <td className="activity-cell">
                                                    <span className="activity-counts">{r.assessmentAttempts ?? 0} ass • {r.quizAttempts ?? 0} qz</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="leaderboard-pagination-footer">
                                    <button
                                        className="btn-secondary pagination-btn"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    >
                                        <FaArrowLeft /> Previous
                                    </button>
                                    <span className="page-indicator">
                                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                                    </span>
                                    <button
                                        className="btn-secondary pagination-btn"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    >
                                        Next <FaArrowRight />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Leaderboard;
