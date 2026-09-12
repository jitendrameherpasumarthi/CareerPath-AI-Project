const { askAI }           = require("../services/aiService");
const ChatConversation    = require("../models/ChatConversation");

// ── helpers ───────────────────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 2000;

function sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
        .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
        .slice(-20) // keep last 20 turns to limit token usage
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));
}

// ── POST /api/chat/ask ────────────────────────────────────────────────────────
const askQuestion = async (req, res) => {
    try {
        const { message, conversationHistory = [], context = {}, conversationId } = req.body;

        console.log(`[Chat] Request received — userId: ${req.userId} — message length: ${(message || "").length}`);

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Message is required." });
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ success: false, message: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
        }

        const cleanHistory = sanitizeHistory(conversationHistory);

        // Add current message to history before sending
        const historyWithCurrent = [
            ...cleanHistory,
            { role: "user", content: message.trim() },
        ];

        console.log(`[Chat] Calling AI service — model: ${process.env.AI_MODEL || "gemini-3.6-flash"}`);
        const { answer, relatedQuestions, error: aiError } = await askAI(message.trim(), historyWithCurrent, context);

        // ── Surface AI-layer errors to the client ─────────────────────────────
        if (aiError) {
            console.error(`[Chat] AI service returned error: ${aiError}`);
            return res.status(500).json({ success: false, message: aiError });
        }

        console.log(`[Chat] AI response success — answer length: ${(answer || "").length}`);

        // ── Persist conversation ───────────────────────────────────────────────
        let conv;
        try {
            if (conversationId) {
                conv = await ChatConversation.findOneAndUpdate(
                    { _id: conversationId, userId: req.userId },
                    {
                        $push: {
                            messages: {
                                $each: [
                                    { role: "user",      content: message.trim() },
                                    { role: "assistant", content: answer },
                                ],
                            },
                        },
                    },
                    { new: true }
                );
            }
            if (!conv) {
                const title = message.trim().slice(0, 60) + (message.length > 60 ? "…" : "");
                conv = await ChatConversation.create({
                    userId: req.userId,
                    title,
                    messages: [
                        ...cleanHistory.map((m) => ({ role: m.role, content: m.content })),
                        { role: "user",      content: message.trim() },
                        { role: "assistant", content: answer },
                    ],
                });
            }
        } catch (dbErr) {
            console.error("[Chat] DB persist error (non-fatal):", dbErr.message);
        }

        res.json({
            success:        true,
            answer,
            relatedQuestions,
            conversationId: conv?._id || null,
        });
    } catch (error) {
        console.error("[Chat] Unexpected controller error:", error.message || error);
        res.status(500).json({
            success: false,
            message: `Server error: ${error.message || "Unknown error. Check server logs."}`,
        });
    }
};

// ── GET /api/chat/history ─────────────────────────────────────────────────────
const getChatHistory = async (req, res) => {
    try {
        const history = await ChatConversation.find({ userId: req.userId })
            .select("title createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .limit(20);
        res.json({ success: true, history });
    } catch (error) {
        console.error("getChatHistory Error:", error);
        res.status(500).json({ success: false, message: "Error fetching chat history." });
    }
};

// ── GET /api/chat/:conversationId ─────────────────────────────────────────────
const getConversation = async (req, res) => {
    try {
        const conv = await ChatConversation.findOne({
            _id:    req.params.conversationId,
            userId: req.userId,
        });
        if (!conv) return res.status(404).json({ success: false, message: "Conversation not found." });
        res.json({ success: true, conversation: conv });
    } catch (error) {
        console.error("getConversation Error:", error);
        res.status(500).json({ success: false, message: "Error fetching conversation." });
    }
};

// ── DELETE /api/chat/:conversationId ──────────────────────────────────────────
const deleteConversation = async (req, res) => {
    try {
        await ChatConversation.findOneAndDelete({
            _id:    req.params.conversationId,
            userId: req.userId,
        });
        res.json({ success: true, message: "Conversation deleted." });
    } catch (error) {
        console.error("deleteConversation Error:", error);
        res.status(500).json({ success: false, message: "Error deleting conversation." });
    }
};

module.exports = { askQuestion, getChatHistory, getConversation, deleteConversation };
