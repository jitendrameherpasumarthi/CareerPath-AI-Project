import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaCheckCircle,
    FaQuestionCircle,
    FaArrowRight,
    FaArrowLeft,
    FaCode,
    FaCheck,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "./LearningPage.css";

const learningCurriculum = {
    "JavaScript Fundamentals": {
        description: "Master foundational and modern ECMAScript mechanics, functional patterns, and browser APIs.",
        lessons: [
            {
                title: "Variables & Data Types",
                content: `Variables are containers for storing data values. In modern JavaScript, we declare variables using 'let' and 'const', avoiding the legacy function-scoped 'var'.

1. 'const': Used for identifiers that will not be reassigned. Always prefer const by default.
2. 'let': Used for mutable variables that will be reassigned (e.g. in loops).

JavaScript Primitive Types:
• string, number, bigint, boolean, undefined, symbol, null

JavaScript Non-Primitive Types:
• Object, Array, Function`,
                codeSnippet: `// Variable declarations
const appName = "CareerPath AI";
let activeUsers = 1500;

// Primitive vs Object
const student = {
    name: "Alex",
    score: 95,
    isGraduated: false
};

console.log(typeof student); // "object"`,
            },
            {
                title: "Functions & Scope",
                content: `Functions are first-class citizens in JavaScript, meaning they can be assigned to variables, passed as arguments, and returned from other functions.

Modern JavaScript heavily utilizes Arrow Functions for clean lexical 'this' binding.

Key Scope Types:
• Global Scope: Accessible everywhere
• Function Scope: Local to the enclosing function
• Block Scope: Created with {} using let and const`,
                codeSnippet: `// Arrow function with implicit return
const calculateXP = (completedLessons, baseXP = 50) => completedLessons * baseXP;

// Higher order function
const numbers = [1, 2, 3, 4, 5];
const squares = numbers.map((n) => n ** 2);
console.log(squares); // [1, 4, 9, 16, 25]`,
            },
            {
                title: "Arrays & Objects",
                content: `Arrays represent ordered collections of data, while Objects represent key-value mappings of real-world entities.

Essential Array Methods:
• map(): Transforms every element into a new array
• filter(): Selects elements satisfying a predicate
• reduce(): Accumulates elements to a single computed value
• find() & some() / every(): Querying elements`,
                codeSnippet: `const skills = [
    { name: "Python", score: 85 },
    { name: "JavaScript", score: 90 },
    { name: "DSA", score: 45 }
];

// Filter strong skills (>= 80)
const strongSkills = skills.filter(s => s.score >= 80);

// Destructuring & Spread operator
const userProfile = { name: "Sara", role: "Student" };
const updatedProfile = { ...userProfile, role: "Engineer", certified: true };`,
            },
            {
                title: "DOM Manipulation",
                content: `The Document Object Model (DOM) allows JavaScript to inspect, manipulate, and update HTML elements, attributes, and styles dynamically in the browser.

Modern workflows use querySelector, classList, and addEventListener for high performance.`,
                codeSnippet: `// Selecting DOM elements
const submitBtn = document.querySelector("#submit-btn");
const statusDiv = document.querySelector(".status-indicator");

// Event listeners
submitBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    statusDiv.classList.add("active");
    statusDiv.textContent = "Assessment In Progress...";
});`,
            },
            {
                title: "Async JavaScript & Promises",
                content: `JavaScript is single-threaded and uses an asynchronous event loop to handle I/O operations without blocking execution.

Promises represent values that will resolve or reject in the future. Modern code uses 'async/await' for clean, readable asynchronous logic.`,
                codeSnippet: `// Asynchronous API call with async/await
async function fetchSkillDiagnostics(userId) {
    try {
        const response = await fetch(\`/api/skill-gap/\${userId}\`);
        if (!response.ok) throw new Error("Network request failed");
        const data = await response.json();
        return data.skillGap;
    } catch (error) {
        console.error("Diagnostic error:", error.message);
    }
}`,
            },
        ],
    },

    "DSA using Python": {
        description: "Master fundamental data structures and algorithmic complexity for technical coding interviews.",
        lessons: [
            {
                title: "Python Data Structures & Complexity",
                content: `Understanding asymptotic time and space complexity (Big-O notation) is critical for software engineering.

Big-O Hierarchy:
• O(1) Constant Time (Dictionary lookup, array indexing)
• O(log n) Logarithmic Time (Binary Search)
• O(n) Linear Time (Simple traversal)
• O(n log n) Linearithmic Time (Merge Sort, Timsort)
• O(n^2) Quadratic Time (Nested loops)`,
                codeSnippet: `# Big-O Examples in Python
def find_first_element(arr):
    return arr[0]  # O(1) Time

def linear_search(arr, target):
    for item in arr:  # O(n) Time
        if item == target:
            return True
    return False`,
            },
            {
                title: "Arrays, Linked Lists & Pointers",
                content: `Arrays provide contiguous memory with O(1) random index access. Linked Lists provide dynamic sizing with O(1) insertion/deletion at pointers.

Two-Pointer Technique is widely used to solve array problems in O(n) time and O(1) space.`,
                codeSnippet: `# Two-pointer pair sum on sorted array
def has_pair_with_sum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        current_sum = nums[left] + nums[right]
        if current_sum == target:
            return (left, right)
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return None`,
            },
            {
                title: "Stacks & Queues",
                content: `• Stack: Last-In, First-Out (LIFO). Ideal for backtracking, parenthesis matching, and undo buffers.
• Queue: First-In, First-Out (FIFO). Ideal for breadth-first traversals and scheduling.`,
                codeSnippet: `from collections import deque

# Queue via collections.deque
queue = deque()
queue.append("Student 1")
queue.append("Student 2")
served = queue.popleft() # "Student 1" (O(1))

# Stack via standard list
stack = []
stack.append(10)
stack.append(20)
top = stack.pop() # 20 (O(1))`,
            },
            {
                title: "Trees & Binary Search Trees",
                content: `Trees are hierarchical data structures. In a Binary Search Tree (BST), every node has at most two children, and the left child is smaller than the parent while the right is larger.

Tree Traversals:
• In-Order (Left, Root, Right) -> Produces sorted values in BST
• Pre-Order (Root, Left, Right)
• Post-Order (Left, Right, Root)`,
                codeSnippet: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traversal(root):
    if not root:
        return []
    return inorder_traversal(root.left) + [root.val] + inorder_traversal(root.right)`,
            },
            {
                title: "Searching, Sorting & Graphs",
                content: `Searching algorithms allow fast retrieval. Graph algorithms like Breadth-First Search (BFS) and Depth-First Search (DFS) explore connected networks.

• Merge Sort & Quick Sort: O(n log n)
• Dijkstra's Algorithm: Shortest path in weighted graphs`,
                codeSnippet: `# Binary Search (Iterative O(log n))
def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
            },
        ],
    },

    "React Basics": {
        description: "Build reactive, high-performance web applications using React component architecture.",
        lessons: [
            {
                title: "React Introduction & JSX",
                content: `React is a declarative component-based JavaScript library for building user interfaces. JSX allows you to write HTML-like syntax directly inside JavaScript.`,
                codeSnippet: `function GreetingCard({ name }) {
    return (
        <div className="card">
            <h2>Hello, {name}!</h2>
            <p>Welcome to CareerPath AI</p>
        </div>
    );
}`,
            },
            {
                title: "Components & Props",
                content: `Components let you split the UI into independent, reusable pieces. Props are inputs passed from parent to child components.`,
                codeSnippet: `function SkillPill({ skillName, score }) {
    return (
        <span className="badge">
            {skillName}: {score}%
        </span>
    );
}`,
            },
            {
                title: "State & useState Hook",
                content: `State represents the component's internal data that changes over time. Calling state updater triggers re-rendering of the component.`,
                codeSnippet: `import { useState } from "react";

function Counter() {
    const [count, setCount] = useState(0);
    return (
        <button onClick={() => setCount(prev => prev + 1)}>
            Clicked {count} times
        </button>
    );
}`,
            },
            {
                title: "Lifecycle with useEffect",
                content: `The useEffect hook lets you perform side effects in functional components like data fetching, subscriptions, and timers.`,
                codeSnippet: `import { useEffect, useState } from "react";
import api from "./api";

function ProfileViewer() {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        api.get("/profile/me").then(res => setProfile(res.data.user));
    }, []);

    return <div>{profile?.name}</div>;
}`,
            },
            {
                title: "Routing & API Integration",
                content: `Single Page Applications (SPAs) use client-side routers like React Router DOM to navigate seamlessly without page reloads.`,
                codeSnippet: `import { Routes, Route, Link } from "react-router-dom";

function Navigation() {
    return (
        <nav>
            <Link to="/student/dashboard">Dashboard</Link>
            <Link to="/assessment">Assessment</Link>
        </nav>
    );
}`,
            },
        ],
    },

    "DBMS": {
        description: "Learn relational database design, SQL querying, transactions, and indexing.",
        lessons: [
            {
                title: "Database Fundamentals & ER Modeling",
                content: `A Database Management System (DBMS) allows structured data storage, manipulation, and retrieval. Entity-Relationship (ER) models define schemas and relationships.`,
                codeSnippet: `-- Create Table
CREATE TABLE Students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
            },
            {
                title: "SQL Queries & DDL/DML",
                content: `• DDL (Data Definition Language): CREATE, ALTER, DROP
• DML (Data Manipulation Language): SELECT, INSERT, UPDATE, DELETE`,
                codeSnippet: `-- Insert and Select
INSERT INTO Students (name, email) VALUES ('Rahul', 'rahul@gmail.com');
SELECT * FROM Students WHERE name LIKE 'R%';`,
            },
            {
                title: "Joins, Subqueries & Aggregations",
                content: `Joins combine rows from two or more tables based on a related column. Types include INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN.`,
                codeSnippet: `SELECT s.name, a.totalScore
FROM Students s
INNER JOIN Assessments a ON s.student_id = a.userId
WHERE a.totalScore > 75;`,
            },
            {
                title: "Normalization (1NF to BCNF)",
                content: `Normalization is the process of organizing data in a database to reduce data redundancy and eliminate anomalies (insert, update, delete).`,
                codeSnippet: `-- 1NF: Atomic values
-- 2NF: No partial dependency on composite key
-- 3NF: No transitive dependency (non-key attributes depend only on primary key)`,
            },
            {
                title: "Transactions, ACID & Indexing",
                content: `ACID Properties:
• Atomicity: All or nothing
• Consistency: Enforces schema constraints
• Isolation: Concurrency safety
• Durability: Persisted to disk`,
                codeSnippet: `BEGIN TRANSACTION;
UPDATE Accounts SET balance = balance - 500 WHERE id = 1;
UPDATE Accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;`,
            },
        ],
    },
};

function LearningPage() {
    const { topic } = useParams();
    const navigate = useNavigate();

    const decodedTopic = topic ? decodeURIComponent(topic) : "JavaScript Fundamentals";
    const courseData =
        learningCurriculum[decodedTopic] ||
        learningCurriculum["JavaScript Fundamentals"];

    const [activeLessonIndex, setActiveLessonIndex] = useState(0);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [saving, setSaving] = useState(false);

    // Fetch user progress for this course
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await api.get(`/course-progress/${encodeURIComponent(decodedTopic)}`);
                if (response.data.success && response.data.progress) {
                    setCompletedLessons(response.data.progress.completedLessons || []);
                }
            } catch (error) {
                console.error("Fetch Progress Error:", error);
            }
        };

        fetchProgress();
    }, [decodedTopic]);

    const currentLesson = courseData.lessons[activeLessonIndex] || courseData.lessons[0];
    const isLessonCompleted = completedLessons.includes(currentLesson.title);

    const handleMarkComplete = async () => {
        setSaving(true);
        try {
            const response = await api.post("/course-progress/complete", {
                courseId: decodedTopic,
                lesson: currentLesson.title,
            });

            if (response.data.success) {
                setCompletedLessons(response.data.progress.completedLessons);
            }
        } catch (error) {
            console.error("Error marking lesson complete:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="learning-layout">
            <Sidebar />

            <div className="learning-main">
                <Navbar />

                <main className="learning-content">
                    {/* HERO */}
                    <div className="learning-hero-card">
                        <div className="learning-hero-info">
                            <span className="badge badge-purple" style={{ marginBottom: "8px" }}>
                                Interactive Module
                            </span>
                            <h1>{decodedTopic}</h1>
                            <p>{courseData.description}</p>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => navigate(`/quiz/${encodeURIComponent(decodedTopic.split(" ")[0])}`)}
                        >
                            <FaQuestionCircle /> Take Topic Quiz
                        </button>
                    </div>

                    {/* SPLIT LAYOUT */}
                    <div className="learning-split-grid">
                        {/* LESSONS MENU */}
                        <div className="lessons-menu-card">
                            <h3>Curriculum Lessons</h3>
                            {courseData.lessons.map((lesson, idx) => {
                                const isDone = completedLessons.includes(lesson.title);
                                const isActive = activeLessonIndex === idx;

                                return (
                                    <button
                                        key={idx}
                                        className={`lesson-nav-item ${isActive ? "active" : ""}`}
                                        onClick={() => setActiveLessonIndex(idx)}
                                    >
                                        <span>{idx + 1}. {lesson.title}</span>
                                        {isDone && <FaCheckCircle className="lesson-completed-dot" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* LESSON READER */}
                        <div className="lesson-reader-pane">
                            <div className="lesson-header-row">
                                <div>
                                    <span className="badge badge-info" style={{ marginBottom: "6px" }}>
                                        Lesson {activeLessonIndex + 1} of {courseData.lessons.length}
                                    </span>
                                    <h2>{currentLesson.title}</h2>
                                </div>

                                <button
                                    className={isLessonCompleted ? "btn-secondary" : "btn-primary"}
                                    onClick={handleMarkComplete}
                                    disabled={saving}
                                >
                                    {isLessonCompleted ? (
                                        <>
                                            <FaCheck style={{ color: "#34d399" }} /> Completed
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle /> {saving ? "Saving..." : "Mark as Complete"}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* BODY CONTENT */}
                            <div className="lesson-body-content">
                                {currentLesson.content}
                            </div>

                            {/* CODE SNIPPET */}
                            {currentLesson.codeSnippet && (
                                <div>
                                    <h4 style={{ color: "var(--text-accent)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <FaCode /> Interactive Code Example
                                    </h4>
                                    <pre className="code-snippet-box">
                                        <code>{currentLesson.codeSnippet}</code>
                                    </pre>
                                </div>
                            )}

                            {/* FOOTER ACTIONS */}
                            <div className="lesson-action-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setActiveLessonIndex((prev) => Math.max(0, prev - 1))}
                                    disabled={activeLessonIndex === 0}
                                >
                                    <FaArrowLeft /> Previous Lesson
                                </button>

                                <button
                                    className="btn-primary"
                                    onClick={() => setActiveLessonIndex((prev) => Math.min(courseData.lessons.length - 1, prev + 1))}
                                    disabled={activeLessonIndex === courseData.lessons.length - 1}
                                >
                                    Next Lesson <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default LearningPage;