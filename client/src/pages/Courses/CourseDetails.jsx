import { useParams, useNavigate } from "react-router-dom";
import {
    FaGraduationCap,
    FaClock,
    FaLayerGroup,
    FaPlay,
    FaCheckCircle,
} from "react-icons/fa";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "./CourseDetails.css";

const coursesData = {
    javascript: {
        title: "JavaScript Fundamentals",
        learningTopic: "JavaScript Fundamentals",
        icon: "🟨",
        description: "Master modern ECMAScript, closures, asynchronous patterns, DOM manipulation, and modern web application development.",
        level: "Beginner → Advanced",
        duration: "8 Weeks",
        lessons: 5,
        quizzes: 2,
        topics: [
            "Variables & Data Types",
            "Functions & Scope",
            "Arrays & Objects",
            "DOM Manipulation",
            "Async JavaScript & Promises",
            "Event Loop & Microtasks",
            "ES6+ Modern Syntax",
            "REST API Fetching",
        ],
    },

    python: {
        title: "DSA using Python",
        learningTopic: "DSA using Python",
        icon: "🐍",
        description: "Build robust algorithmic problem-solving skills covering lists, stacks, queues, trees, graphs, sorting, and dynamic programming.",
        level: "Beginner → Advanced",
        duration: "10 Weeks",
        lessons: 5,
        quizzes: 2,
        topics: [
            "Python Data Structures & Complexity",
            "Arrays, Linked Lists & Pointers",
            "Stacks & Queues",
            "Trees & Binary Search Trees",
            "Searching, Sorting & Graphs",
            "Recursion & Backtracking",
            "Dynamic Programming Basics",
            "Bit Manipulation",
        ],
    },

    react: {
        title: "React Basics",
        learningTopic: "React Basics",
        icon: "⚛️",
        description: "Build modular, high-performance user interfaces with React components, hooks, state management, and modern routing.",
        level: "Intermediate",
        duration: "6 Weeks",
        lessons: 5,
        quizzes: 2,
        topics: [
            "React Introduction & JSX",
            "Components & Props",
            "State & useState Hook",
            "Lifecycle with useEffect",
            "Routing & API Integration",
            "Custom Hooks",
            "Context API & Global State",
            "Performance Optimization",
        ],
    },

    dbms: {
        title: "Database Management System",
        learningTopic: "DBMS",
        icon: "🗄️",
        description: "Understand relational databases, SQL queries, indexing, normalization, transactions, and ACID properties.",
        level: "Beginner → Intermediate",
        duration: "6 Weeks",
        lessons: 5,
        quizzes: 2,
        topics: [
            "Database Fundamentals & ER Modeling",
            "SQL Queries & DDL/DML",
            "Joins, Subqueries & Aggregations",
            "Normalization (1NF to BCNF)",
            "Transactions, ACID & Indexing",
            "Views & Triggers",
            "NoSQL & MongoDB Basics",
            "Concurrency Control",
        ],
    },
};

function CourseDetails() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const normalizedId = (courseId || "javascript").toLowerCase();
    const course =
        coursesData[normalizedId] || coursesData.javascript;

    return (
        <div className="course-details-layout">
            <Sidebar />

            <div className="course-details-main">
                <Navbar />

                <main className="course-details-content">
                    {/* HERO BANNER */}
                    <div className="course-hero-banner">
                        <div className="course-hero-left">
                            <div className="course-big-icon">{course.icon}</div>
                            <div className="course-hero-text">
                                <span className="badge badge-purple" style={{ marginBottom: "8px" }}>
                                    Comprehensive Course
                                </span>
                                <h1>{course.title}</h1>
                                <p>{course.description}</p>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ padding: "14px 28px", fontSize: "1rem" }}
                            onClick={() => navigate(`/learning/${encodeURIComponent(course.learningTopic)}`)}
                        >
                            <FaPlay /> Start Learning Now
                        </button>
                    </div>

                    {/* METRICS ROW */}
                    <div className="stats-overview-grid">
                        <div className="stat-metric-card">
                            <div className="metric-icon-box purple">
                                <FaLayerGroup />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Difficulty</span>
                                <span className="metric-value" style={{ fontSize: "1.2rem" }}>
                                    {course.level}
                                </span>
                            </div>
                        </div>

                        <div className="stat-metric-card">
                            <div className="metric-icon-box blue">
                                <FaClock />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Duration</span>
                                <span className="metric-value" style={{ fontSize: "1.2rem" }}>
                                    {course.duration}
                                </span>
                            </div>
                        </div>

                        <div className="stat-metric-card">
                            <div className="metric-icon-box emerald">
                                <FaGraduationCap />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Lessons</span>
                                <span className="metric-value" style={{ fontSize: "1.2rem" }}>
                                    {course.lessons} Core Modules
                                </span>
                            </div>
                        </div>

                        <div className="stat-metric-card">
                            <div className="metric-icon-box amber">
                                <FaCheckCircle />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Quizzes</span>
                                <span className="metric-value" style={{ fontSize: "1.2rem" }}>
                                    {course.quizzes} Milestone Tests
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SYLLABUS */}
                    <div className="course-syllabus-card">
                        <div className="dashboard-section-header">
                            <div className="section-title-group">
                                <h2>Curriculum Syllabus Breakdown</h2>
                                <p>Topics and core competencies covered in this track</p>
                            </div>
                        </div>

                        <div className="syllabus-topics-grid">
                            {course.topics.map((t, idx) => (
                                <div className="syllabus-topic-item" key={idx}>
                                    <span className="topic-bullet-num">{idx + 1}</span>
                                    <span>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CourseDetails;
