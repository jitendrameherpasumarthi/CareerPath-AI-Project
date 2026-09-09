import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaRocket,
    FaChartLine,
    FaCheckDouble,
    FaBookReader,
    FaTrophy,
    FaRoute,
    FaBullseye,
    FaPlay,
    FaArrowRight,
    FaChalkboardTeacher,
    FaUsers,
    FaGraduationCap,
    FaSyncAlt,
    FaMedal,
    FaAward,
    FaCertificate,
    FaHistory,
    FaFire,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./StudentDashboard.css";

const defaultCourses = [
    {
        id: "JavaScript Fundamentals",
        courseId: "javascript",
        title: "JavaScript Fundamentals",
        description: "Master modern ES6+, async programming, DOM manipulation & web APIs.",
        priority: "High Priority",
        icon: "🟨",
        totalLessons: 5,
    },
    {
        id: "DSA using Python",
        courseId: "python",
        title: "DSA using Python",
        description: "Level up problem solving with trees, graphs, sorting, and dynamic arrays.",
        priority: "High Priority",
        icon: "🐍",
        totalLessons: 5,
    },
    {
        id: "React Basics",
        courseId: "react",
        title: "React Basics",
        description: "Build reactive user interfaces with functional components, hooks & state.",
        priority: "Medium Priority",
        icon: "⚛️",
        totalLessons: 5,
    },
    {
        id: "DBMS",
        courseId: "dbms",
        title: "Database Management System",
        description: "Master relational schema design, complex SQL joins, indexing & ACID.",
        priority: "Medium Priority",
        icon: "🗄️",
        totalLessons: 5,
    },
];

function StudentDashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview"); // "overview" | "roadmap" | "faculty"
    const [searchQuery, setSearchQuery] = useState("");

    // Real Data States
    const [user, setUser] = useState({ name: "Learner", userType: "Student" });
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [skillGap, setSkillGap] = useState(null);
    const [roadmap, setRoadmap] = useState([]);
    const [quizResults, setQuizResults] = useState([]);
    const [courseProgress, setCourseProgress] = useState({});
    const [facultyData, setFacultyData] = useState(null);
    const [myRank, setMyRank] = useState(null);
    const [certificatesList, setCertificatesList] = useState([]);
    const [assessmentStats, setAssessmentStats] = useState({ totalAttempts: 0, bestScore: 0, averageScore: 0 });
    const [quizStats, setQuizStats] = useState({ totalQuizAttempts: 0, bestScore: 0, averageScore: 0 });

    const loadDashboardData = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            else setRefreshing(true);

            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const storedUser = localStorage.getItem("user");
            let currentUser = { name: "Learner", userType: "Student" };
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    setUser(currentUser);
                } catch {
                    // ignore
                }
            }

            // Fetch parallel data with Promise.allSettled
            const [
                assessmentRes,
                skillGapRes,
                roadmapRes,
                quizRes,
                progressRes,
                facultyRes,
                rankRes,
                certRes,
                assStatsRes,
                qzStatsRes,
            ] = await Promise.allSettled([
                api.get("/assessment/latest"),
                api.get("/skill-gap"),
                api.get("/roadmap"),
                api.get("/quiz/results"),
                api.get("/course-progress/all"),
                currentUser.userType === "Faculty" ? api.get("/profile/faculty/analytics") : Promise.resolve({ data: null }),
                api.get("/rankings/me"),
                api.get("/certificates/my"),
                api.get("/assessment/stats"),
                api.get("/quiz/stats"),
            ]);

            // Latest Assessment
            if (assessmentRes.status === "fulfilled" && assessmentRes.value.data?.success) {
                setLatestAssessment(assessmentRes.value.data.assessment);
            }

            // Skill Gap
            if (skillGapRes.status === "fulfilled" && skillGapRes.value.data?.success) {
                setSkillGap(skillGapRes.value.data);
            }

            // Roadmap
            if (roadmapRes.status === "fulfilled" && roadmapRes.value.data?.success) {
                setRoadmap(roadmapRes.value.data.roadmap || []);
            }

            // Quiz Results
            if (quizRes.status === "fulfilled" && quizRes.value.data?.success) {
                setQuizResults(quizRes.value.data.results || []);
            }

            // Course Progress
            if (progressRes.status === "fulfilled" && progressRes.value.data?.success) {
                const progMap = progressRes.value.data.progress || {};
                const calculated = {};
                defaultCourses.forEach((c) => {
                    const found = progMap[c.id] || { completedLessons: [] };
                    const completed = found.completedLessons?.length || 0;
                    calculated[c.id] = {
                        completed,
                        percentage: Math.round((completed / c.totalLessons) * 100),
                    };
                });
                setCourseProgress(calculated);
            }

            // Faculty Analytics
            if (facultyRes.status === "fulfilled" && facultyRes.value?.data?.success) {
                setFacultyData(facultyRes.value.data.analytics);
            }

            // User Global Rank
            if (rankRes.status === "fulfilled" && rankRes.value?.data?.success) {
                setMyRank(rankRes.value.data);
            }

            // Certificates
            if (certRes.status === "fulfilled" && certRes.value?.data?.success) {
                setCertificatesList(certRes.value.data.certificates || []);
            }

            // Assessment Stats
            if (assStatsRes.status === "fulfilled" && assStatsRes.value?.data?.success) {
                setAssessmentStats(assStatsRes.value.data);
            }

            // Quiz Stats
            if (qzStatsRes.status === "fulfilled" && qzStatsRes.value?.data?.success) {
                setQuizStats(qzStatsRes.value.data);
            }
        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Computed Values
    const overallScore = latestAssessment?.totalScore ?? skillGap?.totalScore ?? 0;
    const skillsList = skillGap?.skillGap ? Object.entries(skillGap.skillGap) : [];
    const masteredCount = skillsList.filter(([, s]) => s.status?.toLowerCase() === "strong").length;

    const totalCompletedLessons = Object.values(courseProgress).reduce(
        (acc, val) => acc + (val.completed || 0),
        0
    );
    const totalPossibleLessons = defaultCourses.reduce((acc, c) => acc + c.totalLessons, 0);
    const overallProgressPercent = totalPossibleLessons > 0 ? Math.round((totalCompletedLessons / totalPossibleLessons) * 100) : 0;

    const latestQuiz = quizResults.length > 0 ? quizResults[0] : null;

    // Filter courses for search
    const filteredCourses = defaultCourses.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <Navbar />
                    <LoadingSpinner message="Syncing with CareerPath AI Engine..." />
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="dashboard-main">
                <Navbar onSearch={setSearchQuery} searchQuery={searchQuery} />

                <main className="dashboard-content">
                    {/* ================= WELCOME HERO BANNER ================= */}
                    <section className="welcome-hero">
                        <div className="welcome-text-col">
                            <div className="welcome-eyebrow">
                                AI Personalization Portal • {user.userType || "Student"}
                            </div>
                            <h1>Welcome back, {user.name}! 👋</h1>
                            <p>
                                Continue building your personalized career journey with real-time AI skill diagnostics and milestone tracking.
                            </p>

                            <div className="welcome-meta-chips">
                                <div className="meta-chip">
                                    <FaBullseye />
                                    <span>Goal: {user.careerGoal || "Software Engineer"}</span>
                                </div>
                                <div className="meta-chip">
                                    <FaGraduationCap />
                                    <span>{user.branch || user.department || "Technology Track"}</span>
                                </div>
                                <div className="meta-chip">
                                    <FaBookReader />
                                    <span>{totalCompletedLessons} Lessons Done ({overallProgressPercent}%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="welcome-action-col">
                            <button
                                className="btn-primary"
                                onClick={() => navigate("/assessment")}
                            >
                                <FaRocket /> {latestAssessment ? "Retake AI Assessment" : "Start Skill Assessment"}
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={() => loadDashboardData(true)}
                                title="Refresh Database Data"
                            >
                                <FaSyncAlt className={refreshing ? "spin-anim" : ""} /> Refresh Data
                            </button>
                        </div>
                    </section>

                    {/* ================= FACULTY ANALYTICS TAB (IF FACULTY ACTIVE) ================= */}
                    {activeTab === "faculty" && facultyData && (
                        <section className="faculty-analytics-panel">
                            <div className="dashboard-section-header">
                                <div className="section-title-group">
                                    <h2><FaChalkboardTeacher /> Class Performance & Institutional Analytics</h2>
                                    <p>Aggregate evaluation of registered students across programming and algorithmic domains</p>
                                </div>
                            </div>

                            <div className="stats-overview-grid">
                                <div className="stat-metric-card">
                                    <div className="metric-icon-box purple"><FaUsers /></div>
                                    <div className="metric-info">
                                        <span className="metric-label">Total Students</span>
                                        <span className="metric-value">{facultyData.totalStudents}</span>
                                        <span className="metric-sub">Enrolled learners</span>
                                    </div>
                                </div>

                                <div className="stat-metric-card">
                                    <div className="metric-icon-box blue"><FaChartLine /></div>
                                    <div className="metric-info">
                                        <span className="metric-label">Class Avg Score</span>
                                        <span className="metric-value">{facultyData.averageClassScore}%</span>
                                        <span className="metric-sub">Overall assessment</span>
                                    </div>
                                </div>

                                <div className="stat-metric-card">
                                    <div className="metric-icon-box emerald"><FaCheckDouble /></div>
                                    <div className="metric-info">
                                        <span className="metric-label">Tests Completed</span>
                                        <span className="metric-value">{facultyData.totalAssessmentsCompleted}</span>
                                        <span className="metric-sub">Total submissions</span>
                                    </div>
                                </div>

                                <div className="stat-metric-card">
                                    <div className="metric-icon-box amber"><FaBullseye /></div>
                                    <div className="metric-info">
                                        <span className="metric-label">DSA Avg</span>
                                        <span className="metric-value">{facultyData.skillAverages?.DSA || 0}%</span>
                                        <span className="metric-sub">Data Structures</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Submissions Table */}
                            <div className="faculty-table-container">
                                <table className="faculty-table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Roll No / Dept</th>
                                            <th>Total Score</th>
                                            <th>Python</th>
                                            <th>JavaScript</th>
                                            <th>DSA</th>
                                            <th>Submission Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facultyData.recentAssessments?.length > 0 ? (
                                            facultyData.recentAssessments.map((item) => (
                                                <tr key={item.id}>
                                                    <td><strong>{item.studentName}</strong></td>
                                                    <td>{item.studentRoll}</td>
                                                    <td>
                                                        <span className={`badge ${item.totalScore >= 75 ? "badge-strong" : item.totalScore >= 50 ? "badge-moderate" : "badge-needs-improvement"}`}>
                                                            {item.totalScore}%
                                                        </span>
                                                    </td>
                                                    <td>{item.scores?.Python || 0}%</td>
                                                    <td>{item.scores?.JavaScript || 0}%</td>
                                                    <td>{item.scores?.DSA || 0}%</td>
                                                    <td>{new Date(item.date).toLocaleDateString()}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                                                    No student submissions recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* ================= STATS OVERVIEW GRID ================= */}
                    {activeTab !== "faculty" && (
                        <>
                            {/* ================= MY PERFORMANCE & GLOBAL STANDING ================= */}
                            <section className="glass-panel" style={{ padding: "26px" }}>
                                <div className="dashboard-section-header">
                                    <div className="section-title-group">
                                        <h2><FaTrophy style={{ color: "#fbbf24" }} /> My Performance &amp; Global Standing</h2>
                                        <p>Your verified ranking, assessment attempts, quiz drill accuracy, and earned credentials</p>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                        <button className="btn-secondary" onClick={() => navigate("/leaderboard")}>
                                            <FaMedal /> View Leaderboard
                                        </button>
                                        <button className="btn-secondary" onClick={() => navigate("/certificates")}>
                                            <FaCertificate /> My Certificates
                                        </button>
                                    </div>
                                </div>

                                <div className="performance-summary-grid">
                                    <div className="performance-metric-box rank-box">
                                        <span className="perf-lbl"><FaFire style={{ color: "#f59e0b" }} /> Global Rank</span>
                                        <strong className="perf-val">#{myRank?.rank || "--"}</strong>
                                        <span className="perf-sub">{myRank?.totalRankedUsers ? `Top ${myRank.percentile}% of ${myRank.totalRankedUsers} learners` : "Active student"}</span>
                                    </div>

                                    <div className="performance-metric-box score-box">
                                        <span className="perf-lbl"><FaChartLine style={{ color: "#818cf8" }} /> Performance Score</span>
                                        <strong className="perf-val">{myRank?.performanceScore || "--"}</strong>
                                        <span className="perf-sub">Explainable weighted score</span>
                                    </div>

                                    <div className="performance-metric-box">
                                        <span className="perf-lbl"><FaRocket style={{ color: "#22d3ee" }} /> Assessment Attempts</span>
                                        <strong className="perf-val">{assessmentStats.totalAttempts}</strong>
                                        <span className="perf-sub">
                                            Best: {assessmentStats.bestScore}% • Avg: {assessmentStats.averageScore}%
                                        </span>
                                        <button className="btn-text-link" onClick={() => navigate("/assessment/history")}>
                                            <FaHistory /> View History →
                                        </button>
                                    </div>

                                    <div className="performance-metric-box">
                                        <span className="perf-lbl"><FaCheckDouble style={{ color: "#34d399" }} /> Quiz Attempts</span>
                                        <strong className="perf-val">{quizStats.totalQuizAttempts}</strong>
                                        <span className="perf-sub">
                                            Best: {quizStats.bestScore}% • Avg: {quizStats.averageScore}%
                                        </span>
                                        <button className="btn-text-link" onClick={() => navigate("/quiz/history")}>
                                            <FaHistory /> View History →
                                        </button>
                                    </div>

                                    <div className="performance-metric-box">
                                        <span className="perf-lbl"><FaAward style={{ color: "#fbbf24" }} /> Certificates</span>
                                        <strong className="perf-val">{certificatesList.length}</strong>
                                        <span className="perf-sub">Verified credentials</span>
                                        <button className="btn-text-link" onClick={() => navigate("/certificates")}>
                                            <FaCertificate /> View All →
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="stats-overview-grid">
                                <div className="stat-metric-card">
                                    <div className="metric-icon-box purple">
                                        <FaChartLine />
                                    </div>
                                    <div className="metric-info">
                                        <span className="metric-label">Overall Assessment</span>
                                        <span className="metric-value">{overallScore}%</span>
                                        <span className="metric-sub">
                                            {latestAssessment ? `Evaluated on ${new Date(latestAssessment.createdAt).toLocaleDateString()}` : "Pending initial test"}
                                        </span>
                                    </div>
                                </div>

                                <div className="stat-metric-card">
                                    <div className="metric-icon-box blue">
                                        <FaCheckDouble />
                                    </div>
                                    <div className="metric-info">
                                        <span className="metric-label">Skills Mastered</span>
                                        <span className="metric-value">
                                            {masteredCount} / {skillsList.length || 3}
                                        </span>
                                        <span className="metric-sub">Strong proficiency areas</span>
                                    </div>
                                </div>

                                <div className="stat-metric-card">
                                    <div className="metric-icon-box emerald">
                                        <FaBookReader />
                                    </div>
                                    <div className="metric-info">
                                        <span className="metric-label">Lessons Completed</span>
                                        <span className="metric-value">{totalCompletedLessons}</span>
                                        <span className="metric-sub">Across {defaultCourses.length} active tracks</span>
                                    </div>
                                </div>

                                <div className="stat-metric-card">
                                    <div className="metric-icon-box amber">
                                        <FaTrophy />
                                    </div>
                                    <div className="metric-info">
                                        <span className="metric-label">Latest Quiz</span>
                                        <span className="metric-value">{latestQuiz ? `${latestQuiz.percentage}%` : "N/A"}</span>
                                        <span className="metric-sub">{latestQuiz ? `${latestQuiz.topic}` : "No quiz taken yet"}</span>
                                    </div>
                                </div>
                            </section>

                            {/* ================= SKILL GAP ANALYSIS ================= */}
                            <section className="glass-panel" style={{ padding: "28px" }}>
                                <div className="dashboard-section-header">
                                    <div className="section-title-group">
                                        <h2><FaBullseye /> Skill Gap Analysis</h2>
                                        <p>Real-time performance diagnostic evaluated from your assessment responses</p>
                                    </div>

                                    <button
                                        className="btn-outline"
                                        onClick={() => navigate("/assessment")}
                                    >
                                        Retake Test →
                                    </button>
                                </div>

                                <div className="skills-cards-grid">
                                    {skillsList.length > 0 ? (
                                        skillsList.map(([skillName, data]) => {
                                            const statusClass =
                                                data.status?.toLowerCase().includes("strong")
                                                    ? "badge-strong"
                                                    : data.status?.toLowerCase().includes("moderate")
                                                    ? "badge-moderate"
                                                    : "badge-needs-improvement";

                                            return (
                                                <div className="skill-gap-card" key={skillName}>
                                                    <div className="skill-card-top">
                                                        <div className="skill-icon-circle">
                                                            {skillName === "Python" ? "🐍" : skillName === "JavaScript" ? "🟨" : "⚡"}
                                                        </div>
                                                        <div className="skill-score-radial">
                                                            <span className="score-number">{data.score}%</span>
                                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Domain Score</span>
                                                        </div>
                                                    </div>

                                                    <div className="skill-card-body">
                                                        <h3>{skillName}</h3>
                                                        <div className="skill-status-row">
                                                            <span className={`badge ${statusClass}`}>
                                                                {data.status}
                                                            </span>
                                                            <span className={`badge badge-${data.priority?.toLowerCase()}`}>
                                                                {data.priority} Priority
                                                            </span>
                                                        </div>

                                                        <div className="skill-progress-bar-wrap">
                                                            <div className="progress-track">
                                                                <div
                                                                    className="progress-fill"
                                                                    style={{
                                                                        width: `${Math.max(8, data.score || 0)}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="skill-card-footer">
                                                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                                            {data.score < 50 ? "Requires Focused Practice" : data.score < 80 ? "Solid Foundation" : "Advanced Proficiency"}
                                                        </span>
                                                        <button
                                                            className="btn-outline"
                                                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                                                            onClick={() => navigate(`/learning/${encodeURIComponent(skillName === "DSA" ? "DSA using Python" : `${skillName} Fundamentals`)}`)}
                                                        >
                                                            Study Skill
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ gridColumn: "span 3", textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                                            No assessment data found. Click "Start Skill Assessment" above to generate your skill gap analysis.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ================= PERSONALIZED ROADMAP ================= */}
                            <section id="roadmap" className="glass-panel" style={{ padding: "28px" }}>
                                <div className="dashboard-section-header">
                                    <div className="section-title-group">
                                        <h2><FaRoute /> Personalized Career Roadmap</h2>
                                        <p>Curated step-by-step milestones tailored to your career goal and identified skill gaps</p>
                                    </div>
                                </div>

                                <div className="roadmap-timeline-grid">
                                    {roadmap.length > 0 ? (
                                        roadmap.map((item, index) => (
                                            <div className="roadmap-step-card" key={index}>
                                                <div className="step-card-header">
                                                    <div className="step-number-badge">
                                                        {item.step || index + 1}
                                                    </div>
                                                    <span className={`badge ${item.priorityLevel === "High" ? "badge-high" : item.priorityLevel === "Low" ? "badge-low" : "badge-medium"}`}>
                                                        {item.priority}
                                                    </span>
                                                </div>

                                                <div className="step-card-body">
                                                    <h3>{item.skill}</h3>
                                                    <p className="step-recommendation">{item.recommendedAction}</p>

                                                    <ul className="step-topics-list">
                                                        {(item.topics || []).slice(0, 4).map((top, idx) => (
                                                            <li key={idx}>{top}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="step-card-action">
                                                    <div className="progress-track" style={{ marginBottom: "12px" }}>
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${item.estimatedProgress || 30}%` }}
                                                        />
                                                    </div>

                                                    <button
                                                        className="btn-secondary"
                                                        style={{ width: "100%", padding: "8px", fontSize: "0.85rem" }}
                                                        onClick={() => navigate(`/learning/${encodeURIComponent(item.skill)}`)}
                                                    >
                                                        Start Milestone <FaArrowRight style={{ fontSize: "0.75rem" }} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ gridColumn: "span 3", textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                                            Complete your assessment to unlock your personalized curriculum roadmap.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ================= RECOMMENDED LEARNING TOPICS ================= */}
                            <section id="learning-topics" className="glass-panel" style={{ padding: "28px" }}>
                                <div className="dashboard-section-header">
                                    <div className="section-title-group">
                                        <h2><FaBookReader /> Recommended Learning Courses</h2>
                                        <p>Interactive lessons and hands-on programming curriculum</p>
                                    </div>
                                </div>

                                <div className="topics-showcase-grid">
                                    {filteredCourses.map((c) => {
                                        const prog = courseProgress[c.id] || { completed: 0, percentage: 0 };
                                        return (
                                            <div className="topic-course-card" key={c.id}>
                                                <div className="course-card-icon">{c.icon}</div>
                                                <div className="course-card-body">
                                                    <span className="badge badge-purple" style={{ marginBottom: "8px" }}>
                                                        {c.priority}
                                                    </span>
                                                    <h3>{c.title}</h3>
                                                    <p>{c.description}</p>
                                                </div>

                                                <div className="course-progress-section">
                                                    <div className="progress-track">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${prog.percentage}%` }}
                                                        />
                                                    </div>
                                                    <div className="progress-labels">
                                                        <span>{prog.completed} / {c.totalLessons} Lessons</span>
                                                        <span>{prog.percentage}%</span>
                                                    </div>
                                                </div>

                                                <button
                                                    className="btn-primary"
                                                    style={{ width: "100%", padding: "9px" }}
                                                    onClick={() => navigate(`/learning/${encodeURIComponent(c.id)}`)}
                                                >
                                                    <FaPlay style={{ fontSize: "0.75rem" }} />
                                                    {prog.completed > 0 ? "Continue Learning" : "Start Course"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default StudentDashboard;