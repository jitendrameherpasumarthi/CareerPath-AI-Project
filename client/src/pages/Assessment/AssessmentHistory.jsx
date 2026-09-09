import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaRocket,
    FaArrowLeft,
    FaTrophy,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaShieldAlt,
    FaHistory,
    FaChartBar,
    FaRedo,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./AssessmentHistory.css";

function AssessmentHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        bestScore: 0,
        latestScore: 0,
        averageScore: 0,
    });

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [historyRes, statsRes] = await Promise.allSettled([
                api.get("/assessment/history"),
                api.get("/assessment/stats"),
            ]);

            if (historyRes.status === "fulfilled" && historyRes.value.data?.success) {
                setAttempts(historyRes.value.data.attempts || historyRes.value.data.history || []);
            } else if (historyRes.status === "rejected") {
                console.error("Assessment history API error:", historyRes.reason);
                setError(historyRes.reason?.response?.data?.message || "Failed to load assessment history.");
            }

            if (statsRes.status === "fulfilled" && statsRes.value.data?.success) {
                setStats(statsRes.value.data);
            }
        } catch (err) {
            console.error("Fetch assessment history unexpected error:", err);
            setError("An unexpected error occurred while loading assessment attempts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const formatTimeTaken = (seconds) => {
        if (!seconds || seconds <= 0) return "--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (isoString) => {
        if (!isoString) return "--";
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <Navbar />

                <div className="history-page-container">
                    {/* Header */}
                    <div className="history-header-card">
                        <div className="history-header-left">
                            <button className="btn-back-link" onClick={() => navigate("/student/dashboard")}>
                                <FaArrowLeft /> Back to Dashboard
                            </button>
                            <h1><FaHistory /> Assessment Attempt History</h1>
                            <p>Track your diagnostic progress, skill trends, and past proctored evaluations.</p>
                        </div>
                        <button className="btn-primary start-assessment-btn" onClick={() => navigate("/assessment")}>
                            <FaRocket /> Take New Assessment
                        </button>
                    </div>

                    {/* Stats Overview */}
                    <div className="history-stats-grid">
                        <div className="history-stat-card">
                            <div className="stat-icon-wrapper purple"><FaRocket /></div>
                            <div>
                                <span className="stat-label">Total Attempts</span>
                                <h3 className="stat-value">{stats.totalAttempts}</h3>
                            </div>
                        </div>
                        <div className="history-stat-card">
                            <div className="stat-icon-wrapper gold"><FaTrophy /></div>
                            <div>
                                <span className="stat-label">Best Score</span>
                                <h3 className="stat-value">{stats.bestScore}%</h3>
                            </div>
                        </div>
                        <div className="history-stat-card">
                            <div className="stat-icon-wrapper cyan"><FaChartBar /></div>
                            <div>
                                <span className="stat-label">Average Score</span>
                                <h3 className="stat-value">{stats.averageScore}%</h3>
                            </div>
                        </div>
                        <div className="history-stat-card">
                            <div className="stat-icon-wrapper blue"><FaClock /></div>
                            <div>
                                <span className="stat-label">Latest Score</span>
                                <h3 className="stat-value">{stats.latestScore}%</h3>
                            </div>
                        </div>
                    </div>

                    {/* State Handlers: Loading / Error / Empty / Data */}
                    {loading ? (
                        <LoadingSpinner message="Loading attempt history..." />
                    ) : error ? (
                        <div className="empty-history-card">
                            <FaExclamationTriangle style={{ fontSize: "3rem", color: "#fb7185", marginBottom: "8px" }} />
                            <h3 style={{ color: "#fb7185" }}>Unable to Load History</h3>
                            <p>{error}</p>
                            <button className="btn-secondary" onClick={fetchHistory}>
                                <FaRedo /> Try Again
                            </button>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="empty-history-card">
                            <div className="empty-icon"><FaHistory /></div>
                            <h3>No Assessment Attempts Yet</h3>
                            <p>Take your first AI-proctored diagnostic test to analyze skill gaps and unlock your personalized roadmap.</p>
                            <button className="btn-primary" onClick={() => navigate("/assessment")}>
                                <FaRocket /> Start Assessment Now
                            </button>
                        </div>
                    ) : (
                        <div className="attempts-table-wrapper">
                            <table className="attempts-custom-table">
                                <thead>
                                    <tr>
                                        <th>Attempt #</th>
                                        <th>Overall Score</th>
                                        <th>Skill Breakdown (Py / JS / DSA)</th>
                                        <th>Status</th>
                                        <th>Date &amp; Time</th>
                                        <th>Security Integrity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((att) => {
                                        const isAutoSubmitted = att.assessmentStatus === "AUTO_SUBMITTED_SECURITY_EVENT";
                                        return (
                                            <tr key={att._id} className={isAutoSubmitted ? "row-security-event" : ""}>
                                                <td>
                                                    <span className="attempt-badge">Attempt {att.attemptNumber || 1}</span>
                                                </td>
                                                <td>
                                                    <div className="score-cell-pill">
                                                        <strong className={`score-number ${(att.totalScore || 0) >= 70 ? "high" : (att.totalScore || 0) >= 50 ? "medium" : "low"}`}>
                                                            {att.totalScore ?? 0}%
                                                        </strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="skills-inline-tags">
                                                        <span className="skill-tag">Py: {att.scores?.Python ?? 0}%</span>
                                                        <span className="skill-tag">JS: {att.scores?.JavaScript ?? 0}%</span>
                                                        <span className="skill-tag">DSA: {att.scores?.DSA ?? 0}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {isAutoSubmitted ? (
                                                        <span className="status-badge alert" title={att.autoSubmitReason || "Auto-submitted by proctor"}>
                                                            <FaExclamationTriangle /> Auto-Submitted
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge success">
                                                            <FaCheckCircle /> Completed
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="date-cell">
                                                    <div>{formatDate(att.submittedAt || att.createdAt)}</div>
                                                    {att.timeTaken > 0 && (
                                                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                                            <FaClock style={{ marginRight: "4px" }} />
                                                            {formatTimeTaken(att.timeTaken)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {att.securityEventsCount > 0 ? (
                                                        <span className="security-tag flag" title={`${att.securityEventsCount} security log events recorded`}>
                                                            <FaShieldAlt /> {att.securityEventsCount} Event(s)
                                                        </span>
                                                    ) : (
                                                        <span className="security-tag clean">
                                                            <FaShieldAlt /> Verified Clean
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssessmentHistory;
