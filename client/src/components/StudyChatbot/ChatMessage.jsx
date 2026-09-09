/**
 * ChatMessage.jsx
 * Renders a single chat bubble (user or assistant).
 * Renders markdown-style code blocks safely without dangerouslySetInnerHTML.
 */
import { useState } from "react";
import { FaUser, FaRobot, FaCopy, FaCheck } from "react-icons/fa";

// Very small markdown renderer: handles **bold**, `inline-code`, and ```code blocks```
function renderContent(text) {
    if (!text) return [];

    const segments = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
        }
        segments.push({ type: "code", lang: match[1] || "", content: match[2].trim() });
        lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        segments.push({ type: "text", content: text.slice(lastIndex) });
    }
    return segments;
}

// Render inline: **bold** and `code`
function renderInline(line, key) {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
        <span key={key}>
            {parts.map((p, i) => {
                if (p.startsWith("**") && p.endsWith("**"))
                    return <strong key={i}>{p.slice(2, -2)}</strong>;
                if (p.startsWith("`") && p.endsWith("`"))
                    return <code key={i} className="chat-inline-code">{p.slice(1, -1)}</code>;
                return p;
            })}
        </span>
    );
}

function CodeBlock({ lang, content }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="chat-code-block">
            <div className="chat-code-header">
                <span className="chat-code-lang">{lang || "code"}</span>
                <button className="chat-copy-btn" onClick={copy} title="Copy code">
                    {copied ? <FaCheck /> : <FaCopy />}
                    {copied ? " Copied!" : " Copy"}
                </button>
            </div>
            <pre className="chat-code-pre"><code>{content}</code></pre>
        </div>
    );
}

function ChatMessage({ message }) {
    const isUser = message.role === "user";
    const segments = renderContent(message.content);

    return (
        <div className={`chat-msg-row ${isUser ? "chat-msg-user" : "chat-msg-ai"}`}>
            {!isUser && (
                <div className="chat-avatar chat-avatar-ai">
                    <FaRobot />
                </div>
            )}
            <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
                {segments.map((seg, i) => {
                    if (seg.type === "code") {
                        return <CodeBlock key={i} lang={seg.lang} content={seg.content} />;
                    }
                    // text segment: split on newlines
                    return (
                        <div key={i} className="chat-text-segment">
                            {seg.content.split("\n").map((line, j) => (
                                <div key={j} className={line === "" ? "chat-blank-line" : ""}>
                                    {line === "" ? "\u00A0" : renderInline(line, j)}
                                </div>
                            ))}
                        </div>
                    );
                })}
                <span className="chat-msg-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
            {isUser && (
                <div className="chat-avatar chat-avatar-user">
                    <FaUser />
                </div>
            )}
        </div>
    );
}

export default ChatMessage;
