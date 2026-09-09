import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { FaCamera, FaCheckCircle, FaRedo, FaShieldAlt } from "react-icons/fa";

function FaceCapture({ onCapture, initialImage = "" }) {
    const webcamRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [error, setError] = useState("");
    const [capturedImage, setCapturedImage] = useState(initialImage);

    const startCamera = () => {
        setError("");
        setCameraActive(true);
    };

    const handleUserMedia = () => {
        setError("");
        setCameraActive(true);
    };

    const handleUserMediaError = (err) => {
        console.error("Camera Access Error:", err);
        setError("Camera permission denied or camera not found. Please allow access in browser.");
        setCameraActive(false);
    };

    const captureFace = () => {
        if (!webcamRef.current) {
            setError("Camera is not ready yet.");
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setCameraActive(false);
            if (onCapture) {
                onCapture(imageSrc);
            }
        } else {
            setError("Failed to capture snapshot. Please try again.");
        }
    };

    const retakeFace = () => {
        setCapturedImage("");
        setCameraActive(true);
        if (onCapture) {
            onCapture("");
        }
    };

    return (
        <div
            style={{
                background: "rgba(18, 26, 47, 0.9)",
                border: "1px solid var(--border-glow)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                margin: "16px 0",
                textAlign: "center",
                boxShadow: "var(--shadow-md)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "var(--primary-light)",
                    fontSize: "1.05rem",
                    fontWeight: "700",
                    marginBottom: "8px",
                }}
            >
                <FaShieldAlt />
                <span>AI Face Enrollment</span>
            </div>

            <p
                style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    marginBottom: "16px",
                }}
            >
                Consent: Your facial snapshot is captured strictly for identity verification during proctored skill assessments.
            </p>

            {error && (
                <div
                    style={{
                        background: "rgba(244, 63, 94, 0.15)",
                        color: "#fb7185",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        marginBottom: "14px",
                    }}
                >
                    {error}
                </div>
            )}

            {/* PREVIEW OF CAPTURED IMAGE */}
            {capturedImage && (
                <div style={{ marginBottom: "16px" }}>
                    <div
                        style={{
                            position: "relative",
                            display: "inline-block",
                            borderRadius: "14px",
                            overflow: "hidden",
                            border: "2px solid #10b981",
                            boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                        }}
                    >
                        <img
                            src={capturedImage}
                            alt="Captured face reference"
                            style={{
                                width: "240px",
                                height: "180px",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            color: "#34d399",
                            fontWeight: "600",
                            marginTop: "10px",
                            fontSize: "0.9rem",
                        }}
                    >
                        <FaCheckCircle />
                        <span>Face Reference Successfully Registered</span>
                    </div>

                    <button
                        type="button"
                        onClick={retakeFace}
                        className="btn-secondary"
                        style={{
                            marginTop: "12px",
                            padding: "8px 18px",
                            fontSize: "0.85rem",
                        }}
                    >
                        <FaRedo /> Retake Photo
                    </button>
                </div>
            )}

            {/* LIVE CAMERA FEED */}
            {cameraActive && !capturedImage && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                        style={{
                            position: "relative",
                            width: "300px",
                            height: "225px",
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: "2px solid var(--primary)",
                            boxShadow: "0 0 25px rgba(99, 102, 241, 0.4)",
                            background: "#000",
                        }}
                    >
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                facingMode: "user",
                                width: 640,
                                height: 480,
                            }}
                            onUserMedia={handleUserMedia}
                            onUserMediaError={handleUserMediaError}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                        {/* Oval Face Guide Overlay */}
                        <div
                            style={{
                                position: "absolute",
                                top: "15%",
                                left: "25%",
                                width: "50%",
                                height: "70%",
                                border: "2px dashed rgba(255, 255, 255, 0.6)",
                                borderRadius: "50%",
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                        <button
                            type="button"
                            onClick={captureFace}
                            className="btn-primary"
                            style={{ padding: "10px 20px" }}
                        >
                            <FaCamera /> Capture Snapshot
                        </button>
                        <button
                            type="button"
                            onClick={() => setCameraActive(false)}
                            className="btn-secondary"
                            style={{ padding: "10px 16px" }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* TRIGGER CAMERA BUTTON */}
            {!cameraActive && !capturedImage && (
                <button
                    type="button"
                    onClick={startCamera}
                    className="btn-primary"
                    style={{
                        padding: "11px 22px",
                        fontSize: "0.92rem",
                    }}
                >
                    <FaCamera /> Open Camera & Scan Face
                </button>
            )}
        </div>
    );
}

export default FaceCapture;