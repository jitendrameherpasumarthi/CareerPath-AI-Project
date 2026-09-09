import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaQuestionCircle,
    FaCheckCircle,
    FaRedo,
    FaArrowRight,
    FaHome,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "./QuizPage.css";

const quizBank = {
    JavaScript: [
        {
            question: "Which keyword creates a block-scoped mutable variable in modern JavaScript?",
            options: ["var", "let", "define", "const_mut"],
            answer: "let",
        },
        {
            question: "Which array method appends an element to the end of an array and returns its new length?",
            options: ["push()", "pop()", "shift()", "slice()"],
            answer: "push()",
        },
        {
            question: "Which operator is used for strict equality comparison without type coercion?",
            options: ["=", "==", "===", "!=="],
            answer: "===",
        },
        {
            question: "What is the return type of typeof NaN in JavaScript?",
            options: ["'number'", "'nan'", "'undefined'", "'object'"],
            answer: "'number'",
        },
        {
            question: "Which of the following is a feature of Arrow Functions?",
            options: [
                "They have their own this binding",
                "They retain the lexical this of the surrounding scope",
                "They can be used as constructors with 'new'",
                "They automatically run asynchronously"
            ],
            answer: "They retain the lexical this of the surrounding scope",
        },
    ],

    Python: [
        {
            question: "Which keyword is used to define a function in Python?",
            options: ["function", "def", "func", "fn"],
            answer: "def",
        },
        {
            question: "Which of the following collections in Python is immutable?",
            options: ["List", "Dictionary", "Tuple", "Set"],
            answer: "Tuple",
        },
        {
            question: "What is the output of [x*2 for x in range(3)]?",
            options: ["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2]", "[0, 2, 4, 6]"],
            answer: "[0, 2, 4]",
        },
        {
            question: "Which built-in module is used to work with JSON in Python?",
            options: ["json", "pyjson", "serialize", "jsonify"],
            answer: "json",
        },
        {
            question: "What is the purpose of the '__init__' method in a Python class?",
            options: [
                "Class destructor",
                "Instance initializer/constructor",
                "Static method decorator",
                "Module importer"
            ],
            answer: "Instance initializer/constructor",
        },
    ],

    React: [
        {
            question: "What is React primarily used for building?",
            options: [
                "Relational databases",
                "Component-driven user interfaces",
                "Server kernels",
                "Network protocols"
            ],
            answer: "Component-driven user interfaces",
        },
        {
            question: "Which hook is used to manage local state inside a functional component?",
            options: ["useEffect", "useMemo", "useState", "useRef"],
            answer: "useState",
        },
        {
            question: "What is JSX in React?",
            options: [
                "A JavaScript extension syntax resembling HTML",
                "A Java database driver",
                "A CSS preprocessor",
                "A build server"
            ],
            answer: "A JavaScript extension syntax resembling HTML",
        },
        {
            question: "When does the default useEffect callback run?",
            options: [
                "Only on component unmount",
                "After every render cycle",
                "Before DOM mutations",
                "Only on user mouse click"
            ],
            answer: "After every render cycle",
        },
    ],

    DSA: [
        {
            question: "What is the time complexity of searching an element in a balanced Binary Search Tree?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            answer: "O(log n)",
        },
        {
            question: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
            options: ["Queue", "Stack", "Linked List", "Binary Heap"],
            answer: "Stack",
        },
        {
            question: "What traversal method explores all neighbors of a graph node before going deeper?",
            options: ["Depth First Search (DFS)", "Breadth First Search (BFS)", "Binary Search", "Dijkstra"],
            answer: "Breadth First Search (BFS)",
        },
        {
            question: "Which sorting algorithm guarantees O(n log n) time in all worst cases?",
            options: ["Quick Sort", "Merge Sort", "Bubble Sort", "Selection Sort"],
            answer: "Merge Sort",
        },
    ],

    DBMS: [
        {
            question: "What does the 'A' in ACID properties stand for in relational databases?",
            options: ["Availability", "Atomicity", "Accuracy", "Authentication"],
            answer: "Atomicity",
        },
        {
            question: "Which SQL command is part of Data Definition Language (DDL)?",
            options: ["INSERT", "UPDATE", "CREATE", "SELECT"],
            answer: "CREATE",
        },
        {
            question: "Which join returns all rows from the left table and matched rows from the right table?",
            options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"],
            answer: "LEFT JOIN",
        },
    ],
};

function QuizPage() {
    const navigate = useNavigate();
    const { topic } = useParams();

    const initialTopic = topic ? decodeURIComponent(topic).split(" ")[0] : "JavaScript";
    const [selectedTopic, setSelectedTopic] = useState(
        quizBank[initialTopic] ? initialTopic : "JavaScript"
    );

    const questions = quizBank[selectedTopic] || quizBank.JavaScript;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (topic) {
            const decoded = decodeURIComponent(topic).split(" ")[0];
            if (quizBank[decoded]) {
                setSelectedTopic(decoded);
                resetQuiz();
            }
        }
    }, [topic]);

    const resetQuiz = () => {
        setCurrentIndex(0);
        setSelectedAnswer("");
        setScore(0);
        setIsFinished(false);
    };

    const handleTopicChange = (newTopic) => {
        setSelectedTopic(newTopic);
        resetQuiz();
    };

    const currentQuestion = questions[currentIndex];

    const handleNextQuestion = async () => {
        if (!selectedAnswer) {
            alert("Please choose an answer before moving forward.");
            return;
        }

        const isCorrect = selectedAnswer === currentQuestion.answer;
        const newScore = isCorrect ? score + 1 : score;
        setScore(newScore);

        if (currentIndex === questions.length - 1) {
            // Final question - submit to MongoDB
            setSaving(true);
            try {
                await api.post("/quiz/result", {
                    topic: selectedTopic,
                    score: newScore,
                    totalQuestions: questions.length,
                });
            } catch (error) {
                console.error("Save Quiz Error:", error);
            } finally {
                setSaving(false);
                setIsFinished(true);
            }
        } else {
            setCurrentIndex((prev) => prev + 1);
            setSelectedAnswer("");
        }
    };

    const percentage = Math.round((score / questions.length) * 100);

    return (
        <div className="quiz-layout">
            <Sidebar />

            <div className="quiz-main">
                <Navbar />

                <main className="quiz-content">
                    {/* TOPIC SELECTOR */}
                    <div className="quiz-topic-selector-card">
                        <div className="dashboard-section-header" style={{ marginBottom: "8px" }}>
                            <div className="section-title-group">
                                <h2><FaQuestionCircle /> Topic Knowledge Check</h2>
                                <p>Test your mastery and update your live learning progress</p>
                            </div>
                        </div>

                        <div className="topic-pills-grid">
                            {Object.keys(quizBank).map((t) => (
                                <button
                                    key={t}
                                    className={`topic-pill-btn ${selectedTopic === t ? "active" : ""}`}
                                    onClick={() => handleTopicChange(t)}
                                >
                                    {t === "JavaScript" ? "🟨" : t === "Python" ? "🐍" : t === "React" ? "⚛️" : t === "DSA" ? "⚡" : "🗄️"}
                                    <span>{t} Quiz</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ACTIVE QUIZ OR FINISHED RESULTS */}
                    {isFinished ? (
                        <div className="quiz-result-card">
                            <div className="quiz-result-emoji">
                                {percentage >= 80 ? "🏆" : percentage >= 50 ? "🎉" : "📚"}
                            </div>

                            <h2>Quiz Completed!</h2>
                            <p style={{ color: "var(--text-secondary)" }}>
                                Topic: <strong style={{ color: "#ffffff" }}>{selectedTopic}</strong>
                            </p>

                            <div className="quiz-result-score-gauge">
                                <span className="gradient-text">{percentage}%</span>
                            </div>

                            <p style={{ fontSize: "1.05rem" }}>
                                Score: <strong>{score}</strong> of <strong>{questions.length}</strong> correct
                            </p>

                            <div className="quiz-recommendation-box">
                                {percentage >= 80 ? (
                                    <span>🟢 <strong>Mastered:</strong> Excellent work! You have strong command of {selectedTopic}. Ready for next milestone!</span>
                                ) : percentage >= 50 ? (
                                    <span>🟡 <strong>Intermediate:</strong> Good effort! Review the core concepts and retry to achieve mastery.</span>
                                ) : (
                                    <span>🔴 <strong>Needs Focus:</strong> We recommend studying the {selectedTopic} learning module before retrying.</span>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "14px", marginTop: "12px" }}>
                                <button className="btn-primary" onClick={resetQuiz}>
                                    <FaRedo /> Retake Quiz
                                </button>

                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate("/student/dashboard")}
                                >
                                    <FaHome /> Back to Dashboard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="quiz-card">
                            <div className="quiz-card-header">
                                <span className="badge badge-purple">
                                    {selectedTopic} • Question {currentIndex + 1} of {questions.length}
                                </span>

                                <div className="progress-track" style={{ width: "200px" }}>
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${((currentIndex + 1) / questions.length) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <h3 className="quiz-question-text">
                                {currentQuestion.question}
                            </h3>

                            <div className="quiz-options-list">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const optionChar = String.fromCharCode(65 + idx);

                                    return (
                                        <div
                                            key={idx}
                                            className={`quiz-option-btn ${isSelected ? "selected" : ""}`}
                                            onClick={() => setSelectedAnswer(option)}
                                        >
                                            <div
                                                style={{
                                                    width: "28px",
                                                    height: "28px",
                                                    borderRadius: "50%",
                                                    border: "1px solid var(--border-subtle)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: "700",
                                                    background: isSelected ? "var(--primary)" : "transparent",
                                                    color: isSelected ? "#fff" : "var(--text-secondary)",
                                                }}
                                            >
                                                {optionChar}
                                            </div>
                                            <span>{option}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button
                                    className="btn-primary"
                                    onClick={handleNextQuestion}
                                    disabled={saving}
                                >
                                    {currentIndex === questions.length - 1 ? (
                                        <>
                                            <FaCheckCircle /> {saving ? "Submitting..." : "Finish Quiz"}
                                        </>
                                    ) : (
                                        <>
                                            Next Question <FaArrowRight />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default QuizPage;