/**
 * SuggestedQuestions.jsx
 * Renders clickable chip buttons for follow-up questions.
 */
function SuggestedQuestions({ questions, onSelect, disabled }) {
    if (!questions || questions.length === 0) return null;

    return (
        <div className="chat-suggestions-wrap">
            <p className="chat-suggestions-label">Related Questions</p>
            <div className="chat-suggestions-chips">
                {questions.map((q, i) => (
                    <button
                        key={i}
                        className="chat-chip"
                        onClick={() => !disabled && onSelect(q)}
                        disabled={disabled}
                        title={q}
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SuggestedQuestions;
