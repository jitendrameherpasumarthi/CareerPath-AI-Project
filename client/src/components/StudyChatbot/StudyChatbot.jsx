/**
 * StudyChatbot.jsx  –  CareerPath AI Study Doubt Clarification Chatbot
 *
 * • Floating FAB at bottom-right
 * • Route-aware: hides on /assessment, /quiz*, /login, /register
 * • Context-aware: reads topic/course from URL params
 * • Unlimited conversation in session (persisted to backend)
 * • Sends conversation history to AI for context continuity
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams }                   from "react-router-dom";
import {
    FaRobot, FaTimes, FaMinus, FaTrash,
    FaPaperPlane, FaSpinner, FaExclamationCircle,
    FaRedo, FaComments,
} from "react-icons/fa";
import api                 from "../../services/api";
import ChatMessage         from "./ChatMessage";
import SuggestedQuestions  from "./SuggestedQuestions";
import "./StudyChatbot.css";

// ── Routes where the chatbot must NEVER appear (proctored assessment & active quizzes & auth) ──────
const isRestrictedRoute = (pathname) => {
    if (pathname === "/login" || pathname === "/register") return true;
    if (pathname === "/assessment") return true;
    if (pathname === "/quiz" || (pathname.startsWith("/quiz/") && pathname !== "/quiz/history")) return true;
    return false;
};

// ── Empty-state starter suggestions ──────────────────────────────────────────
const STARTER_SUGGESTIONS = [
    "Explain a difficult concept simply",
    "Help me solve a programming problem",
    "What is the difference between stack and queue?",
    "Give me a practice question on recursion",
    "Explain time complexity with an example",
    "Compare BFS and DFS algorithms",
];

function TypingIndicator() {
    return (
        <div className="chat-msg-row chat-msg-ai">
            <div className="chat-avatar chat-avatar-ai"><FaRobot /></div>
            <div className="chat-bubble chat-bubble-ai chat-bubble-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
            </div>
        </div>
    );
}

function StudyChatbot() {
    const location = useLocation();
    const params   = useParams();

    // ── State — ALL hooks must come before any conditional return ─────────────
    const [isOpen,      setIsOpen]      = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages,    setMessages]    = useState([]);
    const [input,       setInput]       = useState("");
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState(null);
    const [convId,      setConvId]      = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef    = useRef(null);

    // ── Route guard (computed, not a conditional return yet) ──────────────────
    const isRestricted = isRestrictedRoute(location.pathname);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading, isOpen, isMinimized]);

    // ── Focus textarea on open ────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // ── Build page context from URL ───────────────────────────────────────────
    const buildContext = useCallback(() => {
        const path = location.pathname;
        if (path.startsWith("/learning/"))    return { currentPage: "Learning",     currentTopic:  decodeURIComponent(params.topic  || "") };
        if (path.startsWith("/course/"))      return { currentPage: "CourseDetails", currentCourse: decodeURIComponent(params.courseId || "") };
        if (path.startsWith("/student/dashboard") || path.startsWith("/dashboard"))
                                              return { currentPage: "StudentDashboard" };
        return { currentPage: "Study" };
    }, [location.pathname, params]);

    // ── Send message ──────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg = { role: "user", content: trimmed, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setError(null);

        // Build history array for the API (exclude the message we just added — controller adds it)
        const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

        try {
            const res = await api.post("/chat/ask", {
                message:             trimmed,
                conversationHistory: historyForApi,
                context:             buildContext(),
                conversationId:      convId,
            });

            if (res.data.success) {
                const aiMsg = {
                    role:             "assistant",
                    content:          res.data.answer,
                    relatedQuestions: res.data.relatedQuestions || [],
                    timestamp:        new Date().toISOString(),
                };
                setMessages((prev) => [...prev, aiMsg]);
                if (res.data.conversationId) setConvId(res.data.conversationId);
            } else {
                throw new Error(res.data.message || "Unexpected error");
            }
        } catch (err) {
            console.error("Chat API error:", err);
            // Surface the real backend error message — helps diagnose config issues
            const backendMsg =
                err.response?.data?.message ||   // HTTP error response from server
                err.message ||                    // Network/JS error
                "Something went wrong. Please try again.";
            setError(backendMsg);
        } finally {
            setLoading(false);
        }
    }, [loading, messages, buildContext, convId]);

    // ── Keyboard handling ─────────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    // ── Clear conversation ────────────────────────────────────────────────────
    const clearChat = () => {
        setMessages([]);
        setConvId(null);
        setError(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (isRestricted) return null;

    return (
        <>
            {/* ── Floating Action Button ─────────────────────────────────── */}
            <button
                className={`chatbot-fab ${isOpen ? "chatbot-fab-active" : ""}`}
                onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                title="Ask AI for Study Help"
                aria-label="Open AI Study Assistant"
            >
                <FaComments className="chatbot-fab-icon" />
                <span className="chatbot-fab-tooltip">Ask AI for Study Help</span>
            </button>

            {/* ── Chat Panel ─────────────────────────────────────────────── */}
            {isOpen && (
                <div className={`chatbot-panel ${isMinimized ? "chatbot-panel-minimized" : ""}`}
                     role="dialog" aria-label="AI Study Assistant">

                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-header-icon"><FaRobot /></div>
                            <div>
                                <h3 className="chatbot-title">AI Study Assistant</h3>
                                <p className="chatbot-subtitle">Ask me anything about your studies</p>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            {messages.length > 0 && (
                                <button className="chatbot-icon-btn" onClick={clearChat} title="Clear chat">
                                    <FaTrash />
                                </button>
                            )}
                            <button className="chatbot-icon-btn" onClick={() => setIsMinimized((p) => !p)}
                                    title={isMinimized ? "Expand" : "Minimize"}>
                                <FaMinus />
                            </button>
                            <button className="chatbot-icon-btn chatbot-close-btn"
                                    onClick={() => setIsOpen(false)} title="Close">
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    {!isMinimized && (
                        <>
                            <div className="chatbot-body" aria-live="polite">
                                {/* Empty state */}
                                {messages.length === 0 && !loading && (
                                    <div className="chatbot-empty">
                                        <div className="chatbot-empty-icon"><FaRobot /></div>
                                        <p className="chatbot-empty-title">Hi! I&apos;m your AI Study Assistant</p>
                                        <p className="chatbot-empty-sub">Ask me any study doubt and I&apos;ll explain it clearly with examples.</p>
                                        <div className="chatbot-starter-chips">
                                            {STARTER_SUGGESTIONS.map((s, i) => (
                                                <button key={i} className="chat-chip chat-chip-starter"
                                                        onClick={() => sendMessage(s)}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Messages */}
                                {messages.map((msg, i) => (
                                    <div key={i}>
                                        <ChatMessage message={msg} />
                                        {msg.role === "assistant" && msg.relatedQuestions?.length > 0 && (
                                            <SuggestedQuestions
                                                questions={msg.relatedQuestions}
                                                onSelect={sendMessage}
                                                disabled={loading}
                                            />
                                        )}
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {loading && <TypingIndicator />}

                                {/* Error */}
                                {error && !loading && (
                                    <div className="chatbot-error">
                                        <FaExclamationCircle />
                                        <span>{error}</span>
                                        <button className="chatbot-retry-btn"
                                                onClick={() => {
                                                    const last = messages.findLast((m) => m.role === "user");
                                                    if (last) {
                                                        setMessages((p) => p.slice(0, -1));
                                                        setError(null);
                                                        sendMessage(last.content);
                                                    }
                                                }}>
                                            <FaRedo /> Retry
                                        </button>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="chatbot-input-area">
                                <textarea
                                    ref={textareaRef}
                                    className="chatbot-textarea"
                                    placeholder="Ask your study doubt… (Enter to send, Shift+Enter for new line)"
                                    value={input}
                                    rows={1}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={loading}
                                    maxLength={2000}
                                    aria-label="Type your question"
                                />
                                <button
                                    className="chatbot-send-btn"
                                    onClick={() => sendMessage(input)}
                                    disabled={loading || !input.trim()}
                                    aria-label="Send message"
                                >
                                    {loading ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}

export default StudyChatbot;
