const Assessment = require("../models/Assessment");
const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");

const roadmapKnowledgeBase = {
    "Programming Fundamentals": {
        topics: [
            "Variables & Data Types",
            "Control Structures & Loops",
            "Functions & Modularity",
            "Object-Oriented Programming (OOP)",
            "Memory Management & Clean Code"
        ],
        action: "Master foundational syntax and coding problem-solving."
    },
    "Data Structures and Algorithms": {
        topics: [
            "Arrays, Strings & Pointers",
            "Linked Lists & Stacks/Queues",
            "Trees & Binary Search Trees",
            "Searching & Sorting Algorithms",
            "Dynamic Programming & Graphs"
        ],
        action: "Practice algorithmic thinking and LeetCode style problems."
    },
    "Web Development": {
        topics: [
            "Semantic HTML5 & Modern CSS3",
            "Responsive Design & Flexbox/Grid",
            "JavaScript DOM Manipulation & Events",
            "Modern React Components & Hooks",
            "State Management & Client Routing"
        ],
        action: "Build responsive, accessible frontend web applications."
    },
    "Backend Development": {
        topics: [
            "Node.js & Express Architecture",
            "RESTful API Design & Best Practices",
            "Authentication with JWT & OAuth 2.0",
            "Middleware, Validation & Security",
            "Async Programming & Error Handling"
        ],
        action: "Develop scalable and secure server-side applications."
    },
    "Databases and APIs": {
        topics: [
            "Relational Databases & SQL Queries",
            "NoSQL Databases & MongoDB Schema Design",
            "Indexing, Transactions & ACID Principles",
            "Database Normalization & Optimization",
            "Third-Party API Integration & Webhooks"
        ],
        action: "Design efficient schemas and query persistent data stores."
    },
    "Projects and Interview Preparation": {
        topics: [
            "Full Stack Capstone Project",
            "Git Version Control & CI/CD Pipelines",
            "System Design Fundamentals",
            "Mock Technical Coding Interviews",
            "Resume Building & Portfolio Deployment"
        ],
        action: "Deploy production applications and prepare for tech interviews."
    },
    "Python": {
        topics: [
            "Python Fundamentals & Collections",
            "Functions, Modules & Packages",
            "Object-Oriented Programming",
            "File Handling & Exception Handling",
            "Libraries (NumPy, Pandas, FastApi)"
        ],
        action: "Strengthen Python core mechanics and idioms."
    },
    "JavaScript": {
        topics: [
            "ES6+ Features, Destructuring & Modules",
            "Closures, Prototypes & 'this' Context",
            "Asynchronous JS (Promises & async/await)",
            "Fetch API & Browser APIs",
            "React Ecosystem & Vite Integration"
        ],
        action: "Master modern asynchronous JavaScript and web APIs."
    },
    "DSA": {
        topics: [
            "Time & Space Complexity (Big-O)",
            "Linear Data Structures (Lists, Stacks, Queues)",
            "Non-Linear Structures (Trees, Graphs)",
            "Recursion & Divide and Conquer",
            "Greedy Algorithms & Dynamic Programming"
        ],
        action: "Level up computational problem solving efficiency."
    },
    "DBMS": {
        topics: [
            "Relational Database Concepts & ER Modeling",
            "Complex SQL Joins & Subqueries",
            "Database Normalization (1NF - BCNF)",
            "Transactions, Concurrency & Indexing",
            "MongoDB & Document Store Modeling"
        ],
        action: "Master relational and document databases."
    }
};

const getRoadmap = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const profile = await StudentProfile.findOne({ userId: req.userId });
        const assessment = await Assessment.findOne({ userId: req.userId }).sort({ createdAt: -1 });

        const careerGoal =
            profile?.careerGoal ||
            user?.careerGoal ||
            user?.profession ||
            "Software Developer";

        const skillScores = assessment?.scores || {};
        const roadmap = [];

        // Define core standard curriculum steps
        const curriculumSteps = [
            {
                step: 1,
                skill: "Programming Fundamentals",
                targetSkill: "Python",
            },
            {
                step: 2,
                skill: "Data Structures and Algorithms",
                targetSkill: "DSA",
            },
            {
                step: 3,
                skill: "Web Development",
                targetSkill: "JavaScript",
            },
            {
                step: 4,
                skill: "Backend Development",
                targetSkill: "JavaScript",
            },
            {
                step: 5,
                skill: "Databases and APIs",
                targetSkill: "DBMS",
            },
            {
                step: 6,
                skill: "Projects and Interview Preparation",
                targetSkill: "General",
            },
        ];

        curriculumSteps.forEach((item) => {
            const mappedScore =
                item.targetSkill && skillScores[item.targetSkill] !== undefined
                    ? skillScores[item.targetSkill]
                    : null;

            let priority = "Medium";
            let status = "In Progress";
            let estimatedProgress = 20;

            if (mappedScore !== null) {
                if (mappedScore >= 80) {
                    priority = "Low";
                    status = "Mastered";
                    estimatedProgress = 90;
                } else if (mappedScore >= 50) {
                    priority = "Medium";
                    status = "Intermediate";
                    estimatedProgress = 55;
                } else {
                    priority = "High";
                    status = "Focus Area";
                    estimatedProgress = 25;
                }
            } else if (item.step === 1) {
                priority = "High";
                estimatedProgress = 40;
            } else if (item.step <= 3) {
                priority = "Medium";
                estimatedProgress = 20;
            } else {
                priority = "Low";
                estimatedProgress = 10;
            }

            const kbData = roadmapKnowledgeBase[item.skill] || {
                topics: [
                    "Core Fundamentals",
                    "Practical Implementation",
                    "Advanced Techniques",
                    "Real-World Projects"
                ],
                action: "Build expertise and apply practical knowledge."
            };

            roadmap.push({
                step: item.step,
                skill: item.skill,
                priority: `${priority} Priority`,
                priorityLevel: priority,
                status,
                score: mappedScore,
                estimatedProgress,
                topics: kbData.topics,
                recommendedAction: kbData.action,
            });
        });

        // Sort by priority if needed or keep chronological steps
        res.json({
            success: true,
            careerGoal,
            hasAssessment: Boolean(assessment),
            totalScore: assessment?.totalScore ?? 0,
            roadmap,
        });
    } catch (error) {
        console.error("Roadmap Error:", error);
        res.status(500).json({
            success: false,
            message: "Error generating personalized roadmap",
        });
    }
};

module.exports = {
    getRoadmap,
};