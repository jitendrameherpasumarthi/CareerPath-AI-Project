const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true
    },

    question: {
        type: String,
        required: true
    },

    options: {
        type: [String],
        required: true
    },

    correctAnswer: {
        type: String,
        required: true
    },

    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Easy"
    },

    explanation: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("Question", questionSchema);