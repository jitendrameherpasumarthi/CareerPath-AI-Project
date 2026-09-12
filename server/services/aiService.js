/**
 * aiService.js – CareerPath AI Study Chatbot
 *
 * SDK     : @google/genai (official Google Gemini SDK, current)
 * Auth    : GEMINI_API_KEY or AI_API_KEY (supports both AIza and AQ. format keys)
 * Docs    : https://ai.google.dev/gemini-api/docs
 */

const { GoogleGenAI } = require("@google/genai");

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are CareerPath AI Study Assistant — a friendly, expert tutor helping students master technical and academic subjects.

Your guidelines:
• Provide clear, accurate, concise explanations tailored to students.
• Always include a practical example when explaining a concept.
• For code questions: explain logic first, then show clean code, then explain it.
• For math/theory: explain step-by-step with a worked example.
• Encourage deeper understanding — ask a thought-provoking follow-up where appropriate.
• Do NOT assist with cheating during examinations or quizzes.
• Keep responses structured but not unnecessarily long.

IMPORTANT — Response format (JSON only, no markdown outside the JSON):
You MUST respond with valid JSON in exactly this shape:
{
  "answer": "Your full explanation here (may use markdown for formatting)",
  "relatedQuestions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]
}

Always generate 3–4 genuinely useful related follow-up questions in the relatedQuestions array.`;

// ── Singleton client ──────────────────────────────────────────────────────────
let ai = null;

/**
 * Validate presence of API key and create the SDK client.
 * Does NOT validate the key format/prefix — accepts AQ., AIza, etc.
 */
function getClient() {
    // Prefer AI_API_KEY, fall back to GEMINI_API_KEY
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "";

    const placeholders = ["", "your_gemini_api_key_here", "paste_your_gemini_api_key_here", "YOUR_API_KEY"];
    if (!apiKey || placeholders.includes(apiKey.toLowerCase().trim())) {
        return { client: null, error: "AI_API_KEY is not configured in server environment variables." };
    }

    const prefix = apiKey.startsWith("AIza") ? "AIza" : apiKey.startsWith("AQ") ? "AQ" : "other";
    console.log(`[AI] Key present: true | Prefix category: ${prefix} | Length: ${apiKey.length}`);

    if (!ai) {
        ai = new GoogleGenAI({ apiKey });
    }
    return { client: ai, error: null };
}

// ── Build context prefix ──────────────────────────────────────────────────────
function buildContextPrefix(context) {
    if (!context) return "";
    const parts = [];
    if (context.currentCourse) parts.push(`Current Course: ${context.currentCourse}`);
    if (context.currentTopic)  parts.push(`Current Topic: ${context.currentTopic}`);
    if (context.currentPage)   parts.push(`Current Page: ${context.currentPage}`);
    return parts.length ? `[Context: ${parts.join(" | ")}]\n\n` : "";
}

/**
 * Main ask function.
 *
 * @param {string} message             – Student's question
 * @param {Array}  conversationHistory – [{role, content}, ...]
 * @param {Object} context             – { currentPage, currentCourse, currentTopic }
 * @returns {{ answer: string|null, relatedQuestions: string[], error: string|null }}
 */
async function askAI(message, conversationHistory = [], context = {}) {
    const modelName = process.env.AI_MODEL || "gemini-3.6-flash";
    console.log(`[AI] Starting request — model: ${modelName}`);

    // 1. Validate key & get client
    const { client, error: keyError } = getClient();
    if (keyError) {
        console.error("[AI] Key error:", keyError);
        return { answer: null, relatedQuestions: [], error: keyError };
    }

    // 2. Build chat contents from history
    //    @google/genai uses contents: [{role, parts: [{text}]}, ...]
    const contents = conversationHistory.slice(0, -1).map((m) => ({
        role:  m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    // Add the current message
    const contextPrefix = buildContextPrefix(context);
    contents.push({ role: "user", parts: [{ text: contextPrefix + message }] });

    // 3. Call Gemini
    let raw;
    try {
        const response = await client.models.generateContent({
            model: modelName,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature:       0.7,
                maxOutputTokens:   2048,
                responseMimeType:  "application/json",
            },
            contents,
        });

        // @google/genai: response.text is a string getter, NOT a function
        raw = (typeof response.text === "function" ? response.text() : response.text)
              ?? response.candidates?.[0]?.content?.parts?.[0]?.text
              ?? "";
        raw = raw.trim();
        console.log("[AI] Gemini response received successfully.");
    } catch (err) {
        const status  = err.status ?? err.httpStatus ?? err.code ?? "unknown";
        const detail  = err.message ?? String(err);
        console.error(`[AI] Gemini API call failed — model: ${modelName} | status: ${status} | ${detail}`);
        return {
            answer:           null,
            relatedQuestions: [],
            error:            `Gemini API error [${status}]: ${detail}`,
        };
    }

    // 4. Parse JSON response
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        console.warn("[AI] Response was not valid JSON; using raw text as answer.");
        parsed = { answer: raw, relatedQuestions: [] };
    }

    return {
        answer:           parsed.answer           || raw,
        relatedQuestions: parsed.relatedQuestions || [],
        error:            null,
    };
}

module.exports = { askAI };
