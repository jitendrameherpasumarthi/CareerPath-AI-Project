const Question = require("../models/Question");
const Assessment = require("../models/Assessment");

// ============================================================
// GET ASSESSMENT QUESTIONS
// ============================================================
const getQuestions = async (req, res) => {
    try {
        const { count = 12, all = "false" } = req.query;

        if (all === "true") {
            const questions = await Question.find().select("question options skill difficulty");
            return res.json({ success: true, count: questions.length, questions });
        }

        const skills   = ["Python", "JavaScript", "DSA"];
        const perSkill = Math.max(1, Math.floor(Number(count) / skills.length));
        let selected   = [];

        for (const skill of skills) {
            const qs      = await Question.find({ skill }).select("question options skill difficulty");
            const shuffled = qs.sort(() => 0.5 - Math.random());
            selected       = selected.concat(shuffled.slice(0, perSkill));
        }

        if (selected.length < Number(count)) {
            const needed     = Number(count) - selected.length;
            const existingIds = selected.map((q) => q._id);
            const extra       = await Question.find({ _id: { $nin: existingIds } })
                .select("question options skill difficulty")
                .limit(needed);
            selected = selected.concat(extra);
        }

        selected.sort(() => 0.5 - Math.random());
        res.json({ success: true, count: selected.length, questions: selected });
    } catch (error) {
        console.error("Get Questions Error:", error);
        res.status(500).json({ success: false, message: "Error fetching assessment questions" });
    }
};

// ============================================================
// SUBMIT ASSESSMENT  (normal + auto-submitted)
// ============================================================
const submitAssessment = async (req, res) => {
    try {
        const {
            answers,
            securityEvents   = [],
            assessmentStatus = "COMPLETED",
            autoSubmitReason = "",
        } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, message: "Valid answers array is required" });
        }

        // ── Score calculation ─────────────────────────────────────────────────
        const questionIds = answers.map((a) => a.questionId).filter(Boolean);
        const dbQuestions = await Question.find({ _id: { $in: questionIds } });
        const qMap        = new Map(dbQuestions.map((q) => [q._id.toString(), q]));

        let correctCount = 0;
        const skillStats = {
            Python:     { correct: 0, total: 0 },
            JavaScript: { correct: 0, total: 0 },
            DSA:        { correct: 0, total: 0 },
        };
        const detailedAnswers = [];

        for (const ans of answers) {
            const q = qMap.get(ans.questionId?.toString());
            if (!q) continue;

            const isCorrect = ans.selectedAnswer === q.correctAnswer;
            if (isCorrect) correctCount++;

            if (!skillStats[q.skill]) skillStats[q.skill] = { correct: 0, total: 0 };
            skillStats[q.skill].total++;
            if (isCorrect) skillStats[q.skill].correct++;

            detailedAnswers.push({
                questionId:     q._id,
                questionText:   q.question,
                skill:          q.skill,
                selectedAnswer: ans.selectedAnswer,
                correctAnswer:  q.correctAnswer,
                isCorrect,
            });
        }

        const totalEvaluated = detailedAnswers.length;
        const totalScore     = totalEvaluated > 0 ? Math.round((correctCount / totalEvaluated) * 100) : 0;

        const scores = {};
        for (const skill of Object.keys(skillStats)) {
            const { correct, total } = skillStats[skill];
            scores[skill] = total > 0 ? Math.round((correct / total) * 100) : 0;
        }

        // ── Validate enum ─────────────────────────────────────────────────────
        const validStatuses = ["COMPLETED", "AUTO_SUBMITTED_SECURITY_EVENT"];
        const finalStatus   = validStatuses.includes(assessmentStatus) ? assessmentStatus : "COMPLETED";
        const isValidForRanking = finalStatus === "COMPLETED";

        // ── Attempt Number Calculation ─────────────────────────────────────────
        const previousAttemptsCount = await Assessment.countDocuments({ userId: req.userId });
        const attemptNumber = previousAttemptsCount + 1;

        const timeTaken = typeof req.body.timeTaken === "number" ? req.body.timeTaken : 0;
        const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : new Date(Date.now() - (timeTaken * 1000));

        // ── Persist ───────────────────────────────────────────────────────────
        const assessment = await Assessment.create({
            userId: req.userId,
            attemptNumber,
            scores: {
                Python:     scores.Python     ?? 0,
                JavaScript: scores.JavaScript ?? 0,
                DSA:        scores.DSA        ?? 0,
            },
            totalScore,
            answers:          detailedAnswers,
            securityEvents:   Array.isArray(securityEvents) ? securityEvents.map((evt) => ({
                type:       evt.type || "",
                device:     evt.device || "",
                confidence: typeof evt.confidence === "number" ? evt.confidence : 0,
                timestamp:  evt.timestamp || new Date(),
                details:    evt.details || "",
            })) : [],
            assessmentStatus: finalStatus,
            autoSubmitReason: autoSubmitReason || "",
            isValidForRanking,
            timeTaken,
            startedAt,
            submittedAt:      new Date(),
        });

        const isAutoSubmit = finalStatus === "AUTO_SUBMITTED_SECURITY_EVENT";

        res.status(201).json({
            success: true,
            message: isAutoSubmit
                ? "Assessment auto-submitted due to a security event"
                : "Assessment submitted successfully",
            result: {
                attemptNumber,
                totalScore,
                correctAnswers:   correctCount,
                totalQuestions:   totalEvaluated,
                skillScores:      scores,
                securityEvents:   securityEvents.length,
                assessmentStatus: finalStatus,
                autoSubmitReason,
                isValidForRanking,
            },
            assessmentId: assessment._id,
            assessment,
        });
    } catch (error) {
        console.error("Submit Assessment Error:", error);
        res.status(500).json({ success: false, message: "Error evaluating and saving assessment" });
    }
};

// ============================================================
// GET LATEST ASSESSMENT
// ============================================================
const getLatestAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findOne({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, assessment: assessment || null });
    } catch (error) {
        console.error("Get Latest Assessment Error:", error);
        res.status(500).json({ success: false, message: "Error fetching latest assessment" });
    }
};

// ============================================================
// GET ASSESSMENT HISTORY (All attempts for logged in user)
// ============================================================
const getAssessmentHistory = async (req, res) => {
    try {
        const attempts = await Assessment.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select("-answers"); // omit large answers array for list performance

        res.json({
            success: true,
            totalAttempts: attempts.length,
            attempts: attempts.map((a) => ({
                _id: a._id,
                attemptNumber: a.attemptNumber || 1,
                totalScore: a.totalScore,
                scores: a.scores,
                assessmentStatus: a.assessmentStatus,
                autoSubmitReason: a.autoSubmitReason,
                isValidForRanking: a.isValidForRanking !== false,
                securityEventsCount: a.securityEvents?.length || 0,
                timeTaken: a.timeTaken || 0,
                submittedAt: a.submittedAt || a.createdAt,
                createdAt: a.createdAt,
            })),
            history: attempts, // backward compatibility
        });
    } catch (error) {
        console.error("Get Assessment History Error:", error);
        res.status(500).json({ success: false, message: "Error fetching assessment history" });
    }
};

// ============================================================
// GET ASSESSMENT STATS
// ============================================================
const getAssessmentStats = async (req, res) => {
    try {
        const assessments = await Assessment.find({ userId: req.userId }).sort({ createdAt: -1 });
        const totalAttempts = assessments.length;

        if (totalAttempts === 0) {
            return res.json({
                success: true,
                totalAttempts: 0,
                bestScore: 0,
                latestScore: 0,
                averageScore: 0,
                validAttempts: 0,
            });
        }

        const validAssessments = assessments.filter((a) => a.isValidForRanking !== false && a.assessmentStatus === "COMPLETED");
        const allScores = assessments.map((a) => a.totalScore || 0);
        const validScores = validAssessments.map((a) => a.totalScore || 0);

        const bestScore = validScores.length > 0 ? Math.max(...validScores) : Math.max(...allScores);
        const latestScore = assessments[0].totalScore || 0;
        const sum = allScores.reduce((acc, val) => acc + val, 0);
        const averageScore = Math.round((sum / totalAttempts) * 10) / 10;

        res.json({
            success: true,
            totalAttempts,
            bestScore,
            latestScore,
            averageScore,
            validAttempts: validAssessments.length,
        });
    } catch (error) {
        console.error("Get Assessment Stats Error:", error);
        res.status(500).json({ success: false, message: "Error calculating assessment statistics" });
    }
};

module.exports = {
    getQuestions,
    submitAssessment,
    getLatestAssessment,
    getAssessmentHistory,
    getAssessmentStats,
};