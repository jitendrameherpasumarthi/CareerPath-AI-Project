import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaRocket,
    FaHome,
    FaClipboardCheck,
    FaRoute,
    FaBookOpen,
    FaQuestionCircle,
    FaGraduationCap,
    FaSignOutAlt,
    FaChalkboardTeacher,
    FaTrophy,
    FaCertificate,
    FaHistory,
} from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({ activeTab, onTabChange }) {
    const navigate = useNavigate();
    const location = useLocation();

    const storedUser = localStorage.getItem("user");
    let user = { name: "User", userType: "Student" };
    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
        } catch {
            // fallback
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const isFaculty = user.userType === "Faculty";

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand" onClick={() => navigate("/student/dashboard")}>
                <div className="brand-icon-box">
                    <FaRocket />
                </div>
                <div className="brand-info">
                    <h2>CareerPath AI</h2>
                    <span>{user.userType || "Learner"} Portal</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {/* Dashboard */}
                <button
                    className={`nav-link-btn ${location.pathname.includes("dashboard") && (!activeTab || activeTab === "overview") ? "active" : ""}`}
                    onClick={() => {
                        if (onTabChange) onTabChange("overview");
                        navigate("/student/dashboard");
                    }}
                >
                    <span className="nav-icon"><FaHome /></span>
                    Dashboard
                </button>

                {/* Leaderboard */}
                <button
                    className={`nav-link-btn ${location.pathname === "/leaderboard" ? "active" : ""}`}
                    onClick={() => navigate("/leaderboard")}
                >
                    <span className="nav-icon"><FaTrophy /></span>
                    Leaderboard
                </button>

                {/* Certificates */}
                <button
                    className={`nav-link-btn ${location.pathname === "/certificates" ? "active" : ""}`}
                    onClick={() => navigate("/certificates")}
                >
                    <span className="nav-icon"><FaCertificate /></span>
                    Certificates
                </button>

                {/* Assessment */}
                <button
                    className={`nav-link-btn ${location.pathname === "/assessment" ? "active" : ""}`}
                    onClick={() => navigate("/assessment")}
                >
                    <span className="nav-icon"><FaClipboardCheck /></span>
                    AI Assessment
                </button>

                {/* Assessment History */}
                <button
                    className={`nav-link-btn ${location.pathname === "/assessment/history" ? "active" : ""}`}
                    onClick={() => navigate("/assessment/history")}
                >
                    <span className="nav-icon"><FaHistory /></span>
                    Assessment History
                </button>

                {/* Personalized Roadmap */}
                <button
                    className={`nav-link-btn ${activeTab === "roadmap" ? "active" : ""}`}
                    onClick={() => {
                        if (location.pathname !== "/student/dashboard") {
                            navigate("/student/dashboard");
                        }
                        if (onTabChange) onTabChange("roadmap");
                        document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" });
                    }}
                >
                    <span className="nav-icon"><FaRoute /></span>
                    Career Roadmap
                </button>

                {/* Learn / Modules */}
                <button
                    className={`nav-link-btn ${location.pathname.startsWith("/learning") ? "active" : ""}`}
                    onClick={() => navigate("/learning/JavaScript%20Fundamentals")}
                >
                    <span className="nav-icon"><FaBookOpen /></span>
                    Learning Center
                </button>

                {/* Quizzes */}
                <button
                    className={`nav-link-btn ${location.pathname === "/quiz" || (location.pathname.startsWith("/quiz/") && location.pathname !== "/quiz/history") ? "active" : ""}`}
                    onClick={() => navigate("/quiz")}
                >
                    <span className="nav-icon"><FaQuestionCircle /></span>
                    Topic Quizzes
                </button>

                {/* Quiz History */}
                <button
                    className={`nav-link-btn ${location.pathname === "/quiz/history" ? "active" : ""}`}
                    onClick={() => navigate("/quiz/history")}
                >
                    <span className="nav-icon"><FaHistory /></span>
                    Quiz History
                </button>

                {/* Courses Catalog */}
                <button
                    className={`nav-link-btn ${location.pathname.startsWith("/course") ? "active" : ""}`}
                    onClick={() => navigate("/course/javascript")}
                >
                    <span className="nav-icon"><FaGraduationCap /></span>
                    Course Catalog
                </button>

                {/* Faculty Analytics Tab for Faculty */}
                {isFaculty && (
                    <button
                        className={`nav-link-btn ${activeTab === "faculty" ? "active" : ""}`}
                        onClick={() => {
                            if (onTabChange) onTabChange("faculty");
                        }}
                    >
                        <span className="nav-icon"><FaChalkboardTeacher /></span>
                        Class Analytics
                    </button>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="motivation-banner">
                    <h4>🚀 Keep Evolving!</h4>
                    <p>Track your skill gaps and unlock your target tech career.</p>
                </div>

                <button className="btn-sidebar-logout" onClick={handleLogout}>
                    <FaSignOutAlt />
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
