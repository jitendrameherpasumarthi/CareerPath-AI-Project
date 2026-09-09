const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    askQuestion,
    getChatHistory,
    getConversation,
    deleteConversation,
} = require("../controllers/chatController");

const router = express.Router();

// Diagnostic: no-auth ping — use to confirm router is mounted
// GET http://localhost:5000/api/chat/ping  → { ok: true }
router.get("/ping", (req, res) => res.json({ ok: true, route: "chat router mounted" }));

// All chat routes are JWT-protected
router.post("/ask", (req, _res, next) => {
    console.log("[Chat Route] POST /api/chat/ask received — userId will be set by authMiddleware");
    next();
}, protect, askQuestion);

router.get("/history",          protect, getChatHistory);
router.get("/:conversationId",  protect, getConversation);
router.delete("/:conversationId", protect, deleteConversation);

module.exports = router;
