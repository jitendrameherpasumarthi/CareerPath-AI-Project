const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        role:    { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
    },
    { timestamps: true, _id: false }
);

const chatConversationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User",
            required: true,
            index: true,
        },
        title:    { type: String, default: "New Conversation" },
        messages: [messageSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
