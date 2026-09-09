import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaShieldAlt,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSearch,
    FaAward,
} from "react-icons/fa";
import api from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./VerifyCertificate.css";

function VerifyCertificate() {
    const { verificationCode: paramCode } = useParams();
    const navigate = useNavigate();

    const [inputCode, setInputCode] = useState(paramCode || "");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const verifyCode = useCallback(async (codeToVerify) => {
        if (!codeToVerify || !codeToVerify.trim()) return;

        try {
            setLoading(true);
            setError("");
            setResult(null);

            // Public endpoint - does not require auth token
            const res = await api.get(`/certificates/verify/${encodeURIComponent(codeToVerify.trim())}`);
            if (res.data?.valid) {
                setResult(res.data);
            } else {
                setError("Certificate not found or verification code is invalid.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError(err.response?.data?.message || "Invalid certificate code. Please verify the code and try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (paramCode) {
            verifyCode(paramCode);
        }
    }, [paramCode, verifyCode]);

    const handleSubmit = (e) => {
        e.preventDefault();
        verifyCode(inputCode);
    };

    return (
        <div className="verify-page-wrapper">
            <div className="verify-top-bar">
                <div className="verify-brand" onClick={() => navigate("/")}>
                    <FaAward className="brand-icon" />
                    <span>CareerPath AI Verified Credentials</span>
                </div>
                <button className="btn-secondary" onClick={() => navigate("/login")}>
                    Student Portal Login
                </button>
            </div>

            <div className="verify-main-container">
                <div className="verify-card-box">
                    <div className="verify-header-section">
                        <div className="verify-icon-shield">
                            <FaShieldAlt />
                        </div>
                        <h1>Credential Verification Portal</h1>
                        <p>
                            Authenticate authentic CareerPath AI course certificates issued to students.
                            Enter the unique alphanumeric verification code printed on the certificate.
                        </p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSubmit} className="verify-search-form">
                        <div className="verify-input-group">
                            <input
                                type="text"
                                placeholder="e.g. CPAI-AB12-CD34-EF56"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                className="verify-code-input font-mono"
                            />
                            <button type="submit" className="btn-primary verify-submit-btn" disabled={loading || !inputCode.trim()}>
                                <FaSearch /> {loading ? "Verifying..." : "Verify Certificate"}
                            </button>
                        </div>
                    </form>

                    {/* Result Display */}
                    {loading ? (
                        <LoadingSpinner message="Checking credential registry..." />
                    ) : error ? (
                        <div className="verify-result-card invalid">
                            <div className="result-status-header">
                                <FaExclamationTriangle className="status-icon invalid-icon" />
                                <div>
                                    <h3>Verification Failed</h3>
                                    <span>{error}</span>
                                </div>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="verify-result-card valid">
                            <div className="result-status-header">
                                <FaCheckCircle className="status-icon valid-icon" />
                                <div>
                                    <h3>Officially Verified Credential</h3>
                                    <span>This certificate is authentic and registered in the CareerPath AI ledger.</span>
                                </div>
                            </div>

                            <div className="verified-details-grid">
                                <div className="detail-item">
                                    <span className="detail-lbl">Student Name</span>
                                    <strong className="detail-val">{result.studentName}</strong>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Course Completed</span>
                                    <strong className="detail-val highlight">{result.courseName}</strong>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Completion Date</span>
                                    <span className="detail-val">{result.completionDate}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Certificate ID</span>
                                    <span className="detail-val font-mono">{result.certificateId}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Institution / Affiliation</span>
                                    <span className="detail-val">{result.college}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-lbl">Status</span>
                                    <span className="detail-status-tag">ACTIVE &amp; VALID</span>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="verify-footer-note">
                        <p>
                            CareerPath AI uses cryptographically unique verification codes to protect academic credentials against forgery.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyCertificate;
