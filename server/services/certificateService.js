const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Course = require("../models/Course");

/**
 * Generate unique Certificate ID: CPA-CERT-YYYY-XXXXXX
 */
const generateCertificateId = () => {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `CPA-CERT-${year}-${randomHex}`;
};

/**
 * Generate unique Verification Code: CPAI-XXXX-XXXX-XXXX
 */
const generateVerificationCode = () => {
    const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const p3 = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `CPAI-${p1}-${p2}-${p3}`;
};

/**
 * Issue or retrieve certificate for user & course
 */
const issueCertificate = async (userId, courseId, courseTitle = null) => {
    try {
        // Check if certificate already exists
        let cert = await Certificate.findOne({ userId, courseId });
        if (cert) {
            return cert;
        }

        // Get course title if not provided
        let title = courseTitle;
        if (!title) {
            const course = await Course.findOne({ courseId });
            title = course ? course.title : courseId;
        }

        let certId = generateCertificateId();
        let verCode = generateVerificationCode();

        // Ensure uniqueness
        while (await Certificate.findOne({ certificateId: certId })) {
            certId = generateCertificateId();
        }
        while (await Certificate.findOne({ verificationCode: verCode })) {
            verCode = generateVerificationCode();
        }

        cert = await Certificate.create({
            userId,
            courseId,
            courseName: title,
            certificateId: certId,
            verificationCode: verCode,
            issuedAt: new Date(),
            completionDate: new Date(),
            status: "ACTIVE",
        });

        return cert;
    } catch (err) {
        // Handle race condition with duplicate key error E11000
        if (err.code === 11000) {
            return await Certificate.findOne({ userId, courseId });
        }
        throw err;
    }
};

/**
 * Stream a high-resolution, beautifully styled PDF Certificate
 */
const streamCertificatePDF = (certificate, user, res) => {
    const doc = new PDFDocument({
        layout: "landscape",
        size: "A4", // 841.89 x 595.28 points
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
            Title: `Certificate of Completion - ${certificate.courseName}`,
            Author: "CareerPath AI",
            Subject: `Awarded to ${user.name || "Student"}`,
            Keywords: "Certificate, CareerPath AI, Learning, Completion",
        },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="Certificate-${certificate.certificateId}.pdf"`
    );

    doc.pipe(res);

    const width = doc.page.width;
    const height = doc.page.height;

    // ── Background Base ───────────────────────────────────────────────────────
    doc.rect(0, 0, width, height).fill("#0a0f1d"); // Deep navy background

    // ── Outer Decorative Border (Gold/Indigo Accents) ──────────────────────────
    doc.rect(20, 20, width - 40, height - 40)
        .lineWidth(2)
        .stroke("#312e81"); // Indigo border

    doc.rect(28, 28, width - 56, height - 56)
        .lineWidth(1)
        .stroke("#6366f1"); // Violet accent

    doc.rect(34, 34, width - 68, height - 68)
        .lineWidth(0.75)
        .stroke("#f59e0b"); // Gold hairline

    // ── Inner Certificate Card (Parchment White Area for Crisp Readability) ──
    const cardMargin = 46;
    doc.roundedRect(cardMargin, cardMargin, width - (cardMargin * 2), height - (cardMargin * 2), 8)
        .fill("#ffffff");

    // ── Inner Card Decorative Gold Border ─────────────────────────────────────
    doc.roundedRect(cardMargin + 6, cardMargin + 6, width - (cardMargin * 2) - 12, height - (cardMargin * 2) - 12, 6)
        .lineWidth(1.5)
        .stroke("#f59e0b");

    // ── Top Header Banner / Branding ──────────────────────────────────────────
    doc.fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#6366f1")
        .text("CAREERPATH AI  •  ONLINE LEARNING ACADEMY", 0, 72, { align: "center", characterSpacing: 2 });

    doc.fontSize(8)
        .font("Helvetica")
        .fillColor("#64748b")
        .text("VERIFIED ACADEMIC ACHIEVEMENT & SKILL MASTERY", 0, 90, { align: "center", characterSpacing: 1.5 });

    // ── Title ─────────────────────────────────────────────────────────────────
    doc.fontSize(26)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("CERTIFICATE OF COMPLETION", 0, 115, { align: "center", characterSpacing: 1.5 });

    // Gold decorative divider line
    doc.moveTo(width / 2 - 120, 150)
        .lineTo(width / 2 + 120, 150)
        .lineWidth(2)
        .stroke("#f59e0b");

    // ── Recipient Intro ───────────────────────────────────────────────────────
    doc.fontSize(11)
        .font("Helvetica-Oblique")
        .fillColor("#475569")
        .text("This is to proudly certify that", 0, 168, { align: "center" });

    // ── Student Name ──────────────────────────────────────────────────────────
    const studentName = user.name || "Student Name";
    doc.fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#1e1b4b")
        .text(studentName, 0, 192, { align: "center" });

    // Hairline under name
    doc.moveTo(width / 2 - 160, 224)
        .lineTo(width / 2 + 160, 224)
        .lineWidth(0.75)
        .stroke("#cbd5e1");

    // ── Course Details ────────────────────────────────────────────────────────
    doc.fontSize(11)
        .font("Helvetica")
        .fillColor("#475569")
        .text("has successfully mastered all lessons, modules, and diagnostic requirements for", 0, 240, { align: "center" });

    doc.fontSize(18)
        .font("Helvetica-Bold")
        .fillColor("#4338ca")
        .text(certificate.courseName || "Course Name", 0, 262, { align: "center" });

    // ── Organization statement ────────────────────────────────────────────────
    const college = user.collegeName ? `Affiliation: ${user.collegeName}` : "Demonstrating exceptional technical competence and continuous professional growth.";
    doc.fontSize(9)
        .font("Helvetica-Oblique")
        .fillColor("#64748b")
        .text(college, 0, 292, { align: "center" });

    // ── Footer Section with Verification & Seal ───────────────────────────────
    const footerY = 370;

    // Left Column: Date & ID
    const dateFormatted = new Date(certificate.completionDate || certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    doc.fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("ISSUE DATE", 80, footerY);
    doc.fontSize(9)
        .font("Helvetica")
        .fillColor("#334155")
        .text(dateFormatted, 80, footerY + 14);

    doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#64748b")
        .text("CERTIFICATE ID", 80, footerY + 36);
    doc.fontSize(8)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(certificate.certificateId, 80, footerY + 48);

    // Center: Digital Security Seal Badge
    const centerX = width / 2;
    doc.circle(centerX, footerY + 24, 30)
        .lineWidth(2)
        .stroke("#f59e0b");
    doc.circle(centerX, footerY + 24, 26)
        .lineWidth(0.5)
        .stroke("#6366f1");
    doc.fontSize(7)
        .font("Helvetica-Bold")
        .fillColor("#d97706")
        .text("VERIFIED", centerX - 25, footerY + 12, { width: 50, align: "center" });
    doc.fontSize(6)
        .font("Helvetica")
        .fillColor("#4338ca")
        .text("GENUINE", centerX - 25, footerY + 24, { width: 50, align: "center" });
    doc.fontSize(6)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("★ AI SECURED ★", centerX - 35, footerY + 34, { width: 70, align: "center" });

    // Right Column: Verification Code & Authority Signature
    const rightX = width - 250;
    doc.fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("AUTHORIZED SIGNATURE", rightX, footerY);
    doc.fontSize(10)
        .font("Helvetica-Oblique")
        .fillColor("#4338ca")
        .text("CareerPath AI Academic Board", rightX, footerY + 14);

    doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#64748b")
        .text("VERIFICATION CODE", rightX, footerY + 36);
    doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text(certificate.verificationCode, rightX, footerY + 48);

    // ── Bottom Public Verification Notice ─────────────────────────────────────
    doc.fontSize(7.5)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(`Verify authenticity online with code: ${certificate.verificationCode} at CareerPath AI Portal`, 0, height - 70, { align: "center" });

    doc.end();
};

module.exports = {
    generateCertificateId,
    generateVerificationCode,
    issueCertificate,
    streamCertificatePDF,
};
