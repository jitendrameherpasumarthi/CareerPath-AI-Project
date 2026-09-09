const Certificate = require("../models/Certificate");
const User = require("../models/User");
const { streamCertificatePDF } = require("../services/certificateService");

// ============================================================
// GET ALL CERTIFICATES FOR CURRENT USER
// ============================================================
const getMyCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({
            userId: req.userId,
            status: "ACTIVE",
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: certificates.length,
            certificates,
        });
    } catch (error) {
        console.error("Get My Certificates Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch certificates",
        });
    }
};

// ============================================================
// GET SINGLE CERTIFICATE BY ID
// ============================================================
const getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId }).populate("userId", "name collegeName email");
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found",
            });
        }

        res.json({
            success: true,
            certificate,
        });
    } catch (error) {
        console.error("Get Certificate By ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch certificate",
        });
    }
};

// ============================================================
// PUBLIC VERIFY CERTIFICATE BY VERIFICATION CODE (No Auth Required)
// ============================================================
const verifyCertificatePublic = async (req, res) => {
    try {
        const { verificationCode } = req.params;

        if (!verificationCode) {
            return res.status(400).json({
                valid: false,
                message: "Verification code is required",
            });
        }

        const certificate = await Certificate.findOne({
            verificationCode: verificationCode.trim().toUpperCase(),
        }).populate("userId", "name collegeName");

        if (!certificate || certificate.status !== "ACTIVE") {
            return res.status(404).json({
                valid: false,
                message: "Invalid or revoked certificate code",
            });
        }

        const studentName = certificate.userId?.name || "Verified Student";
        const completionDate = (certificate.completionDate || certificate.issuedAt).toISOString().split("T")[0];

        res.json({
            valid: true,
            certificateId: certificate.certificateId,
            studentName,
            courseName: certificate.courseName,
            completionDate,
            issuedAt: certificate.issuedAt,
            college: certificate.userId?.collegeName || "CareerPath AI Academy",
            status: certificate.status,
        });
    } catch (error) {
        console.error("Public Verify Certificate Error:", error);
        res.status(500).json({
            valid: false,
            message: "Error verifying certificate",
        });
    }
};

// ============================================================
// DOWNLOAD CERTIFICATE PDF
// ============================================================
const downloadCertificatePDF = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId }).populate("userId", "name collegeName email");
        if (!certificate || certificate.status !== "ACTIVE") {
            return res.status(404).json({
                success: false,
                message: "Certificate not found or inactive",
            });
        }

        const user = certificate.userId || { name: "Learner" };
        streamCertificatePDF(certificate, user, res);
    } catch (error) {
        console.error("Download Certificate PDF Error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to generate certificate PDF",
            });
        }
    }
};

module.exports = {
    getMyCertificates,
    getCertificateById,
    verifyCertificatePublic,
    downloadCertificatePDF,
};
