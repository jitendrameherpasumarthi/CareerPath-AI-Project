const Assessment = require("../models/Assessment");

const getSkillGap = async (req, res) => {
    try {
        const assessment = await Assessment.findOne({
            userId: req.userId,
        }).sort({ createdAt: -1 });

        if (!assessment) {
            return res.json({
                success: true,
                hasAssessment: false,
                totalScore: 0,
                message: "No assessment found. Please complete the initial assessment.",
                skillGap: {
                    Python: {
                        score: 0,
                        status: "Not Assessed",
                        priority: "High",
                    },
                    JavaScript: {
                        score: 0,
                        status: "Not Assessed",
                        priority: "High",
                    },
                    DSA: {
                        score: 0,
                        status: "Not Assessed",
                        priority: "High",
                    },
                },
            });
        }

        const skillScores = assessment.scores || {};
        const skillGap = {};

        const defaultSkills = ["Python", "JavaScript", "DSA"];
        const allSkills = Array.from(new Set([...defaultSkills, ...Object.keys(skillScores)]));

        allSkills.forEach((skill) => {
            const score = skillScores[skill] ?? 0;

            let status;
            let priority;

            if (score < 50) {
                status = "Needs Improvement";
                priority = "High";
            } else if (score < 80) {
                status = "Moderate";
                priority = "Medium";
            } else {
                status = "Strong";
                priority = "Low";
            }

            skillGap[skill] = {
                score,
                status,
                priority,
            };
        });

        res.json({
            success: true,
            hasAssessment: true,
            totalScore: assessment.totalScore,
            createdAt: assessment.createdAt,
            skillGap,
        });
    } catch (error) {
        console.error("Skill Gap Error:", error);
        res.status(500).json({
            success: false,
            message: "Error generating skill gap",
        });
    }
};

module.exports = {
    getSkillGap,
};