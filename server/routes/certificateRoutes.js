const express = require("express");
const {
    getMyCertificates,
    getCertificateById,
    verifyCertificatePublic,
    downloadCertificatePDF,
} = require("../controllers/certificateController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// User specific certificates
router.get("/my", protect, getMyCertificates);

// Public verification route (no login required so employers/colleges can verify)
router.get("/verify/:verificationCode", verifyCertificatePublic);

// Single certificate by ID & Download
router.get("/:certificateId", protect, getCertificateById);
router.get("/:certificateId/download", protect, downloadCertificatePDF);

module.exports = router;
