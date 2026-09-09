import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaQuestionCircle,
    FaArrowLeft,
    FaTrophy,
    FaCheckDouble,
    FaChartPie,
    FaCalendarAlt,
    FaPlay,
    FaLayerGroup,
    FaExclamationTriangle,
    FaRedo,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./QuizHistory.css";

const TOPIC_ICONS = {
    Python: "🐍",
    JavaScript: "🟨",
    DSA: "🌲",
    "Data Structures": "🌲",
    React: "⚛️",
    DBMS: "🗄️",
    default: "📝",
};

function QuizHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState("All");
    const [attempts, setAttempts] = useState([]);
    const [stats, setStats] = useState({
        totalQuizAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        latestScore: 0,
        topicStats: [],
    });

    const topicsList = ["All", "Python", "JavaScript", "DSA", "React", "DBMS"];

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const topicQuery = selectedTopic !== "All" ? `?topic=${encodeURIComponent(selectedTopic)}` : "";
            const [historyRes, statsRes] = await Promise.allSettled([
                api.get(`/quiz/history${topicQuery}`),
                api.get("/quiz/stats"),
            ]);

            if (historyRes.status === "fulfilled" && historyRes.value.data?.success) {
                setAttempts(historyRes.value.data.results || historyRes.value.data.rawResults || []);
            } else if (historyRes.status === "rejected") {
                console.error("Quiz history API error:", historyRes.reason);
                setError(historyRes.reason?.response?.data?.message || "Failed to load quiz attempt history.");
            }

            if (statsRes.status === "fulfilled" && statsRes.value.data?.success) {
                setStats(statsRes.value.data);
            }
        } catch (err) {
            console.error("Fetch quiz history unexpected error:", err);
            setError("An unexpected error occurred while fetching quiz results.");
        } finally {
            setLoading(false);
        }
    }, [selectedTopic]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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

                <div className="quiz-history-container">
                    {/* Header */}
                    <div className="quiz-history-header">
                        <div className="quiz-header-left">
                            <button className="btn-back-link" onClick={() => navigate("/student/dashboard")}>
                                <FaArrowLeft /> Back to Dashboard
                            </button>
                            <h1><FaQuestionCircle /> Quiz Attempt History</h1>
                            <p>Review your individual topic drill attempts, question accuracy, and mastery scores.</p>
                        </div>
                        <button className="btn-primary" onClick={() => navigate("/quiz")}>
                            <FaPlay /> Take a Quiz
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="quiz-stats-row">
                        <div className="quiz-stat-card">
                            <div className="q-icon-box purple"><FaLayerGroup /></div>
                            <div>
                                <span className="q-label">Total Quizzes</span>
                                <h3 className="q-val">{stats.totalQuizAttempts}</h3>
                            </div>
                        </div>
                        <div className="quiz-stat-card">
                            <div className="q-icon-box gold"><FaTrophy /></div>
                            <div>
                                <span className="q-label">Best Score</span>
                                <h3 className="q-val">{stats.bestScore}%</h3>
                            </div>
                        </div>
                        <div className="quiz-stat-card">
                            <div className="q-icon-box cyan"><FaChartPie /></div>
                            <div>
                                <span className="q-label">Average Score</span>
                                <h3 className="q-val">{stats.averageScore}%</h3>
                            </div>
                        </div>
                        <div className="quiz-stat-card">
                            <div className="q-icon-box green"><FaCheckDouble /></div>
                            <div>
                                <span className="q-label">Latest Score</span>
                                <h3 className="q-val">{stats.latestScore}%</h3>
                            </div>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="topic-filter-bar">
                        <span className="filter-label">Filter by Topic:</span>
                        <div className="filter-pills-list">
                            {topicsList.map((t) => (
                                <button
                                    key={t}
                                    className={`topic-pill ${selectedTopic === t ? "active" : ""}`}
                                    onClick={() => setSelectedTopic(t)}
                                >
                                    <span>{TOPIC_ICONS[t] || TOPIC_ICONS.default}</span>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* State Handlers: Loading / Error / Empty / Data */}
                    {loading ? (
                        <LoadingSpinner message="Loading quiz history..." />
                    ) : error ? (
                        <div className="empty-quiz-card">
                            <FaExclamationTriangle style={{ fontSize: "3rem", color: "#fb7185", marginBottom: "8px" }} />
                            <h3 style={{ color: "#fb7185" }}>Unable to Load Quiz History</h3>
                            <p>{error}</p>
                            <button className="btn-secondary" onClick={fetchHistory}>
                                <FaRedo /> Try Again
                            </button>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="empty-quiz-card">
                            <div className="empty-icon"><FaQuestionCircle /></div>
                            <h3>No Quiz Attempts Found</h3>
                            <p>You haven&apos;t taken any quizzes for {selectedTopic === "All" ? "any topic" : selectedTopic} yet.</p>
                            <button className="btn-primary" onClick={() => navigate(selectedTopic !== "All" ? `/quiz/${encodeURIComponent(selectedTopic)}` : "/quiz")}>
                                <FaPlay /> Start Practice Quiz
                            </button>
                        </div>
                    ) : (
                        <div className="quiz-table-wrapper">
                            <table className="quiz-custom-table">
                                <thead>
                                    <tr>
                                        <th>Topic</th>
                                        <th>Attempt #</th>
                                        <th>Score</th>
                                        <th>Accuracy</th>
                                        <th>Completion Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((q) => {
                                        const displayTopic = q.topic && q.topic !== "undefined" ? q.topic : "General Practice";
                                        return (
                                            <tr key={q._id}>
                                                <td>
                                                    <div className="topic-cell">
                                                        <span className="topic-emoji">{TOPIC_ICONS[displayTopic] || "📝"}</span>
                                                        <strong>{displayTopic}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="attempt-pill">Attempt #{q.attemptNumber || 1}</span>
                                                </td>
                                                <td>
                                                    <span className="score-count">{q.score ?? 0} / {q.totalQuestions ?? 0}</span>
                                                </td>
                                                <td>
                                                    <div className="accuracy-pill">
                                                        <strong className={`acc-val ${(q.percentage || 0) >= 80 ? "high" : (q.percentage || 0) >= 60 ? "med" : "low"}`}>
                                                            {q.percentage ?? 0}%
                                                        </strong>
                                                    </div>
                                                </td>
                                                <td className="date-cell">
                                                    <FaCalendarAlt style={{ marginRight: 6, opacity: 0.6 }} />
                                                    {formatDate(q.completedAt || q.createdAt)}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-retake-quiz"
                                                        onClick={() => navigate(displayTopic !== "General Practice" ? `/quiz/${encodeURIComponent(displayTopic)}` : "/quiz")}
                                                    >
                                                        Retake Quiz
                                                    </button>
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

export default QuizHistory;
