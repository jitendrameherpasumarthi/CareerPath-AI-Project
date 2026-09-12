import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaCertificate,
    FaDownload,
    FaEye,
    FaCheckCircle,
    FaArrowLeft,
    FaGraduationCap,
    FaShareAlt,
    FaTimes,
    FaShieldAlt,
    FaExclamationTriangle,
    FaRedo,
} from "react-icons/fa";
import api from "../../services/api";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Certificates.css";

function Certificates() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [previewCert, setPreviewCert] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);

    const storedUser = localStorage.getItem("user");
    let currentUser = { name: "Student" };
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch {
            // ignore
        }
    }

    const fetchCertificates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/certificates/my");
            if (res.data?.success) {
                setCertificates(res.data.certificates || []);
            } else {
                setError(res.data?.message || "Failed to fetch certificates.");
            }
        } catch (err) {
            console.error("Fetch certificates error:", err);
            setError(err.response?.data?.message || "An error occurred while loading your certificates.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const handleDownloadPDF = async (cert) => {
        try {
            setDownloadingId(cert.certificateId);
            const response = await api.get(`/certificates/${cert.certificateId}/download`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Certificate-${cert.certificateId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF download error:", err);
            alert("Could not download certificate PDF. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleCopyVerifyLink = (verificationCode) => {
        const basePath = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, "") : "";
        const verifyUrl = `${window.location.origin}${basePath}/verify/${verificationCode}`;
        navigator.clipboard.writeText(verifyUrl);
        setCopiedCode(verificationCode);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    const formatDate = (isoString) => {
        if (!isoString) return "--";
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <Navbar />

                <div className="certificates-page-container">
                    {/* Header */}
                    <div className="certificates-header-card">
                        <div className="cert-header-left">
                            <button className="btn-back-link" onClick={() => navigate("/student/dashboard")}>
                                <FaArrowLeft /> Back to Dashboard
                            </button>
                            <h1><FaCertificate className="cert-gold-icon" /> My Course Certificates</h1>
                            <p>
                                Verified credentials issued automatically upon 100% completion of course modules.
                                Download authentic PDFs or share verification links with employers.
                            </p>
                        </div>
                        <button className="btn-secondary" onClick={() => navigate("/course/javascript")}>
                            <FaGraduationCap /> Course Catalog
                        </button>
                    </div>

                    {/* State Handlers: Loading / Error / Empty / Data */}
                    {loading ? (
                        <LoadingSpinner message="Loading your certificates..." />
                    ) : error ? (
                        <div className="empty-certificates-card">
                            <FaExclamationTriangle style={{ fontSize: "3.5rem", color: "#fb7185", marginBottom: "8px" }} />
                            <h3 style={{ color: "#fb7185" }}>Unable to Load Certificates</h3>
                            <p>{error}</p>
                            <button className="btn-secondary" onClick={fetchCertificates}>
                                <FaRedo /> Try Again
                            </button>
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="empty-certificates-card">
                            <div className="empty-cert-icon"><FaGraduationCap /></div>
                            <h3>No Certificates Earned Yet</h3>
                            <p>
                                Complete all lessons in any course to automatically earn and unlock your verifiable CareerPath AI Certificate of Completion.
                            </p>
                            <button className="btn-primary" onClick={() => navigate("/course/javascript")}>
                                <FaGraduationCap /> Browse Courses &amp; Start Learning
                            </button>
                        </div>
                    ) : (
                        <div className="certificates-grid">
                            {certificates.map((cert) => (
                                <div key={cert._id} className="certificate-item-card">
                                    <div className="cert-card-banner">
                                        <FaCertificate className="banner-cert-icon" />
                                        <span className="verified-badge"><FaCheckCircle /> Verified Credential</span>
                                    </div>

                                    <div className="cert-card-body">
                                        <h3 className="cert-course-title">{cert.courseName}</h3>
                                        <p className="cert-recipient-name">Awarded to: <strong>{currentUser.name}</strong></p>

                                        <div className="cert-meta-info-block">
                                            <div className="cert-meta-row">
                                                <span className="meta-lbl">Certificate ID:</span>
                                                <strong className="meta-val font-mono">{cert.certificateId}</strong>
                                            </div>
                                            <div className="cert-meta-row">
                                                <span className="meta-lbl">Issued On:</span>
                                                <span className="meta-val">{formatDate(cert.completionDate || cert.issuedAt)}</span>
                                            </div>
                                            <div className="cert-meta-row">
                                                <span className="meta-lbl">Verification Code:</span>
                                                <span className="meta-code font-mono">{cert.verificationCode}</span>
                                            </div>
                                        </div>

                                        <div className="cert-card-actions">
                                            <button
                                                className="btn-cert-action preview"
                                                onClick={() => setPreviewCert(cert)}
                                            >
                                                <FaEye /> Preview
                                            </button>
                                            <button
                                                className="btn-cert-action download"
                                                disabled={downloadingId === cert.certificateId}
                                                onClick={() => handleDownloadPDF(cert)}
                                            >
                                                <FaDownload /> {downloadingId === cert.certificateId ? "Generating..." : "Download PDF"}
                                            </button>
                                            <button
                                                className="btn-cert-action verify"
                                                onClick={() => handleCopyVerifyLink(cert.verificationCode)}
                                                title="Copy public verification URL"
                                            >
                                                <FaShareAlt /> {copiedCode === cert.verificationCode ? "Copied Link!" : "Share / Verify"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Live Certificate Preview Modal */}
                {previewCert && (
                    <div className="cert-modal-backdrop" onClick={() => setPreviewCert(null)}>
                        <div className="cert-modal-dialog" onClick={(e) => e.stopPropagation()}>
                            <button className="cert-modal-close" onClick={() => setPreviewCert(null)}>
                                <FaTimes />
                            </button>

                            {/* Rendered Certificate Frame */}
                            <div className="interactive-certificate-frame">
                                <div className="cert-frame-outer-border">
                                    <div className="cert-frame-inner-card">
                                        <div className="cert-brand-heading">
                                            <h4>CAREERPATH AI ACADEMY</h4>
                                            <span>VERIFIED ACADEMIC ACHIEVEMENT &amp; SKILL MASTERY</span>
                                        </div>

                                        <h2 className="cert-doc-title">CERTIFICATE OF COMPLETION</h2>
                                        <div className="cert-gold-divider" />

                                        <p className="cert-intro-text">This is proudly presented to</p>
                                        <h1 className="cert-student-name">{currentUser.name}</h1>

                                        <p className="cert-desc-text">
                                            for successfully mastering and completing all diagnostic and curriculum requirements for
                                        </p>
                                        <h3 className="cert-course-name">{previewCert.courseName}</h3>

                                        <div className="cert-footer-grid">
                                            <div className="cert-footer-col left">
                                                <span className="lbl">ISSUE DATE</span>
                                                <span className="val">{formatDate(previewCert.completionDate || previewCert.issuedAt)}</span>
                                                <span className="lbl mt">CERTIFICATE ID</span>
                                                <span className="val font-mono">{previewCert.certificateId}</span>
                                            </div>

                                            <div className="cert-footer-seal">
                                                <div className="seal-circle">
                                                    <FaShieldAlt className="seal-shield" />
                                                    <span>VERIFIED</span>
                                                </div>
                                            </div>

                                            <div className="cert-footer-col right">
                                                <span className="lbl">AUTHORIZED BY</span>
                                                <span className="val">Academic Board</span>
                                                <span className="lbl mt">VERIFICATION CODE</span>
                                                <span className="val font-mono">{previewCert.verificationCode}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="cert-modal-bottom-bar">
                                <button className="btn-primary" onClick={() => handleDownloadPDF(previewCert)}>
                                    <FaDownload /> Download Official PDF
                                </button>
                                <button className="btn-secondary" onClick={() => handleCopyVerifyLink(previewCert.verificationCode)}>
                                    <FaShareAlt /> {copiedCode === previewCert.verificationCode ? "Verification Link Copied!" : "Copy Verification Link"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Certificates;
