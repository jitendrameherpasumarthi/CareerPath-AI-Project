/**
 * Assessment.jsx  –  CareerPath AI Secure Proctored Assessment
 *
 * Security features:
 *   • Fullscreen mode mandatory  – exit = immediate auto-submit
 *   • Tab-switch / window-blur   – immediate auto-submit
 *   • Multi-person detection     – TF.js COCO-SSD, confirmed across 2 frames
 *   • Suspicious audio detection – Web Audio API amplitude heuristic (prototype)
 *   • Copy/Paste/Cut/ContextMenu – blocked during active assessment
 *   • Single handleSecurityAutoSubmit() funnels ALL security paths
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate }                               from "react-router-dom";
import Webcam                                        from "react-webcam";
import * as cocoSsd                                  from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";                           // registers the WebGL backend
import {
    FaRocket, FaClock, FaVideo,
    FaShieldAlt, FaExclamationTriangle, FaArrowLeft,
    FaArrowRight, FaCheck, FaLock, FaExpand, FaEye,
    FaMobileAlt,
} from "react-icons/fa";
import api           from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Assessment.css";

// ─── Configuration ────────────────────────────────────────────────────────────
const TOTAL_TIME           = 900;   // 15 minutes
const DEDUP_MS             = 2000;  // ignore identical security event within 2 s
const PERSON_CONFIRM_LIMIT = 2;     // consecutive frames with ≥2 persons before auto-submit
const FACE_MISSING_SECS    = 7;     // seconds with 0 persons before recording event
const AUDIO_THRESHOLD      = 0.18;  // 0–1  RMS amplitude threshold
const AUDIO_SUSTAINED_SECS = 4;     // seconds of sustained loud audio

// ─── Prohibited Electronic Devices Configuration ──────────────────────────────
/**
 * Prohibited object classes detectable by TensorFlow.js COCO-SSD model.
 * COCO-SSD provides pre-trained classification for common objects including electronic items.
 *
 * Technical Note on COCO-SSD Object Detection:
 * Detection reliability depends on several environmental factors:
 * - Camera quality, focal length, and resolution (320x240 webcam stream)
 * - Room lighting conditions and glare on device screens
 * - Device orientation, visibility, and distance from the lens
 * - Partial occlusion (covered by hands, clothing, or table edge)
 * - Model confidence score threshold
 */
const PROHIBITED_DEVICE_CLASSES   = [
    "cell phone",
    "laptop",
];
const DEVICE_CONFIDENCE_THRESHOLD = 0.60; // 60% minimum confidence to reduce false positives
const DEVICE_CONFIRM_LIMIT        = 2;    // 2 consecutive detection frames required before auto-submit

// ─── Security event human-readable messages ───────────────────────────────────
const SECURITY_MESSAGES = {
    TAB_SWITCH:                            "Student switched browser tab or minimized the window.",
    WINDOW_BLUR:                           "Assessment window lost focus — another application was opened.",
    FULLSCREEN_EXIT:                       "Student exited fullscreen mode during the assessment.",
    MULTIPLE_PERSONS_DETECTED:             "Multiple persons detected in camera frame.",
    PROHIBITED_ELECTRONIC_DEVICE_DETECTED: "Prohibited electronic device detected in camera frame.",
    FACE_MISSING:                          "Student's face was not detected for an extended period.",
    SUSPICIOUS_EXTERNAL_AUDIO:             "Sustained external audio detected — possible unauthorised assistance.",
    CAMERA_STOPPED:                        "Camera stream stopped or disconnected.",
};

// ─── Dismiss reasons that get shown to the student ───────────────────────────
const USER_MESSAGES = {
    TAB_SWITCH:                            "Your assessment was automatically submitted because you left the secure assessment environment.",
    WINDOW_BLUR:                           "Your assessment was automatically submitted because you switched to another application.",
    FULLSCREEN_EXIT:                       "Your assessment was automatically submitted because you exited fullscreen mode.",
    MULTIPLE_PERSONS_DETECTED:             "Your assessment was automatically submitted because multiple persons were detected.",
    PROHIBITED_ELECTRONIC_DEVICE_DETECTED: "Your assessment was automatically submitted because a prohibited electronic device (e.g. mobile phone/laptop) was detected.",
    SUSPICIOUS_EXTERNAL_AUDIO:             "Your assessment was automatically submitted because unauthorized audio activity was detected.",
    default:                               "Your assessment was automatically submitted due to a security event.",
};

// ─────────────────────────────────────────────────────────────────────────────
function Assessment() {
    const navigate   = useRef(useNavigate()).current; // stable ref
    const webcamRef  = useRef(null);

    // ── Questions / answers ──────────────────────────────────────────────────
    const [questions,    setQuestions]    = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers,      setAnswers]      = useState({});
    const [loading,      setLoading]      = useState(true);
    const answersRef  = useRef({});   // always current

    // ── Session flow ─────────────────────────────────────────────────────────
    const [hasStarted,     setHasStarted]     = useState(false);
    const [permissionError, setPermissionError] = useState("");
    const [fullscreenDenied, setFullscreenDenied] = useState(false);
    const [isFullscreen,   setIsFullscreen]   = useState(false);

    // ── Submission ───────────────────────────────────────────────────────────
    const [submitting,    setSubmitting]    = useState(false);
    const submittingRef  = useRef(false);
    const [terminated,   setTerminated]    = useState(false);  // locks UI on security event
    const [termReason,   setTermReason]    = useState("");

    // ── Security events ──────────────────────────────────────────────────────
    const securityEventsRef = useRef([]);
    const lastEventTimeRef  = useRef({});  // dedup by type

    // ── Timer ────────────────────────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const timerRef   = useRef(null);

    // ── Person & Device detection ────────────────────────────────────────────
    const tfModelRef            = useRef(null);
    const detectionIntervalRef  = useRef(null);
    const multiPersonCountRef   = useRef(0);
    const deviceDetectionCountRef = useRef(0);
    const faceMissingTimerRef   = useRef(null);
    const isInferringRef        = useRef(false); // prevents overlapping TF calls

    // ── Debug / proctoring status (visible in camera panel) ──────────────────
    const [cameraActive,      setCameraActive]      = useState(false);
    const [modelStatus,       setModelStatus]       = useState("loading"); // "loading" | "active" | "error"
    const [personsDetected,   setPersonsDetected]   = useState(0);
    const [multiPersonChecks, setMultiPersonChecks] = useState(0);
    const [detectedDevice,    setDetectedDevice]    = useState(null);
    const [deviceConfidence,  setDeviceConfidence]  = useState(0);
    const [deviceChecks,      setDeviceChecks]      = useState(0);

    // ── Audio detection ──────────────────────────────────────────────────────
    const audioContextRef       = useRef(null);
    const analyserRef           = useRef(null);
    const micStreamRef          = useRef(null);
    const audioIntervalRef      = useRef(null);
    const audioSustainedRef     = useRef(0);  // seconds of continuous loud audio

    // ────────────────────────────────────────────────────────────────────────
    // Keep answersRef current
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => { answersRef.current = answers; }, [answers]);

    // ────────────────────────────────────────────────────────────────────────
    // Load questions
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                const res = await api.get("/assessment/questions?count=12");
                setQuestions(res.data.success && res.data.questions?.length > 0
                    ? res.data.questions : []);
            } catch (e) {
                console.error("Fetch Questions Error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────
    const formatTime = (s) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, []);

    const stopDetection = useCallback(() => {
        if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }
        if (faceMissingTimerRef.current)  { clearTimeout(faceMissingTimerRef.current);   faceMissingTimerRef.current  = null; }
    }, []);

    const stopAudio = useCallback(() => {
        if (audioIntervalRef.current) { clearInterval(audioIntervalRef.current); audioIntervalRef.current = null; }
        try { audioContextRef.current?.close(); } catch { /* noop */ }
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    const stopWebcam = useCallback(() => {
        if (webcamRef.current?.video?.srcObject) {
            webcamRef.current.video.srcObject.getTracks().forEach((t) => t.stop());
        }
    }, []);

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // Record a security event (deduplicated)
    // ────────────────────────────────────────────────────────────────────────
    const recordSecurityEvent = useCallback((type, details = "", meta = {}) => {
        const now  = Date.now();
        const last = lastEventTimeRef.current[type] || 0;
        if (now - last < DEDUP_MS) return;
        lastEventTimeRef.current[type] = now;

        const ev = {
            type,
            timestamp:  new Date().toISOString(),
            details,
            device:     meta.device || "",
            confidence: meta.confidence || 0,
        };
        securityEventsRef.current = [...securityEventsRef.current, ev];
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // THE SINGLE SECURITY AUTO-SUBMIT FUNCTION
    // ────────────────────────────────────────────────────────────────────────
    const handleSecurityAutoSubmit = useCallback(async (reason, meta = {}) => {
        // 1. Guard – prevent race conditions
        if (submittingRef.current) return;
        submittingRef.current = true;

        // 2. Lock the UI immediately
        setTerminated(true);
        setTermReason(reason);
        setSubmitting(true);

        // 3. Stop everything
        stopTimer();
        stopDetection();
        stopAudio();
        exitFullscreen();

        // 4. Record the triggering event
        const defaultMsg = SECURITY_MESSAGES[reason] || reason;
        const detailsMsg = meta.device
            ? `${defaultMsg} (${meta.device} - ${Math.round((meta.confidence || 0) * 100)}% confidence)`
            : defaultMsg;
        recordSecurityEvent(reason, detailsMsg, meta);

        // 5. Collect final answers
        const formattedAnswers = Object.entries(answersRef.current).map(
            ([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })
        );

        // 6. Submit to backend
        try {
            await api.post("/assessment/submit", {
                answers:          formattedAnswers,
                securityEvents:   securityEventsRef.current,
                assessmentStatus: "AUTO_SUBMITTED_SECURITY_EVENT",
                autoSubmitReason: reason,
            });
        } catch (err) {
            console.error("Auto-submit failed:", err);
        }

        // 7. Stop webcam last (keep feed visible for the terminal screen)
        stopWebcam();

        // 8. Navigate after a short message display
        setTimeout(() => navigate("/student/dashboard"), 3500);
    }, [stopTimer, stopDetection, stopAudio, exitFullscreen, recordSecurityEvent, stopWebcam, navigate]);

    // ────────────────────────────────────────────────────────────────────────
    // Normal (manual / timer-expired) submit
    // ────────────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (isTimerExpiry = false) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);

        if (!isTimerExpiry) {
            const cnt = Object.keys(answersRef.current).length;
            // guard: if timer still has time and not all answered
            if (cnt < questions.length && timeLeft > 5) {
                const go = window.confirm(`You have answered ${cnt} of ${questions.length} questions. Submit now?`);
                if (!go) { submittingRef.current = false; setSubmitting(false); return; }
            }
        }

        stopTimer();
        stopDetection();
        stopAudio();
        exitFullscreen();

        const formattedAnswers = Object.entries(answersRef.current).map(
            ([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })
        );

        try {
            const res = await api.post("/assessment/submit", {
                answers:          formattedAnswers,
                securityEvents:   securityEventsRef.current,
                assessmentStatus: "COMPLETED",
                autoSubmitReason: "",
            });
            const score = res.data.result?.totalScore ?? 0;
            stopWebcam();
            alert(`✅ Assessment Submitted!\n\nYour Score: ${score}%\n\nYour dashboard has been updated.`);
            navigate("/student/dashboard");
        } catch (err) {
            console.error("Submit error:", err);
            alert("Error submitting. Please try again.");
            submittingRef.current = false;
            setSubmitting(false);
        }
    }, [questions.length, timeLeft, stopTimer, stopDetection, stopAudio, exitFullscreen, stopWebcam, navigate]);

    // ────────────────────────────────────────────────────────────────────────
    // Timer
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasStarted || submittingRef.current) return;
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { stopTimer(); handleSubmit(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return stopTimer;
    }, [hasStarted, handleSubmit, stopTimer]);

    // ────────────────────────────────────────────────────────────────────────
    // Security event listeners (tab-switch, blur, fullscreen)
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasStarted) return;

        const onVisibility = () => {
            if (document.hidden) handleSecurityAutoSubmit("TAB_SWITCH");
        };
        const onBlur = () => {
            // Only fire when document is still visible (deduplicated from visibilitychange)
            if (!document.hidden) handleSecurityAutoSubmit("WINDOW_BLUR");
        };
        const onFsChange = () => {
            const inFs = Boolean(document.fullscreenElement);
            setIsFullscreen(inFs);
            if (!inFs) handleSecurityAutoSubmit("FULLSCREEN_EXIT");
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("blur", onBlur);
        document.addEventListener("fullscreenchange", onFsChange);

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("blur", onBlur);
            document.removeEventListener("fullscreenchange", onFsChange);
        };
    }, [hasStarted, handleSecurityAutoSubmit]);

    // ────────────────────────────────────────────────────────────────────────
    // Copy/Paste/ContextMenu prevention
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasStarted) return;

        const prevent = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
            const ctrl = e.ctrlKey || e.metaKey;
            if (ctrl && ["c", "v", "x", "a"].includes(e.key.toLowerCase())) e.preventDefault();
        };

        document.addEventListener("copy",        prevent);
        document.addEventListener("paste",       prevent);
        document.addEventListener("cut",         prevent);
        document.addEventListener("contextmenu", prevent);
        document.addEventListener("keydown",     handleKeyDown);

        return () => {
            document.removeEventListener("copy",        prevent);
            document.removeEventListener("paste",       prevent);
            document.removeEventListener("cut",         prevent);
            document.removeEventListener("contextmenu", prevent);
            document.removeEventListener("keydown",     handleKeyDown);
        };
    }, [hasStarted]);

    // ────────────────────────────────────────────────────────────────────────
    // TF.js COCO-SSD: multiple-person & prohibited device detection
    // ────────────────────────────────────────────────────────────────────────
    const startPersonDetection = useCallback(async () => {
        // Load model
        try {
            setModelStatus("loading");
            tfModelRef.current = await cocoSsd.load({ base: "lite_mobilenet_v2" });
            setModelStatus("active");
        } catch (e) {
            console.warn("Could not load COCO-SSD model:", e);
            setModelStatus("error");
            return;
        }

        detectionIntervalRef.current = setInterval(async () => {
            // Skip if already in the middle of an inference or if submitting
            if (submittingRef.current || isInferringRef.current) return;
            const video = webcamRef.current?.video;
            if (!video || video.readyState !== 4) return;

            isInferringRef.current = true;
            let predictions = [];
            try {
                predictions = await tfModelRef.current.detect(video);
            } catch {
                isInferringRef.current = false;
                return;
            }
            isInferringRef.current = false;

            if (submittingRef.current) return;

            // ════════════════════════════════════════════════════════════════
            // 1. PERSON DETECTION ANALYSIS
            // ════════════════════════════════════════════════════════════════
            const persons = predictions.filter(
                (p) => p.class === "person" && p.score > 0.55
            );

            // Update debug state
            setPersonsDetected(persons.length);

            // ── 2+ persons → confirm across PERSON_CONFIRM_LIMIT frames ──────
            if (persons.length >= 2) {
                multiPersonCountRef.current += 1;
                setMultiPersonChecks(multiPersonCountRef.current);

                if (multiPersonCountRef.current >= PERSON_CONFIRM_LIMIT) {
                    stopDetection();
                    handleSecurityAutoSubmit("MULTIPLE_PERSONS_DETECTED");
                    return;
                }
            } else {
                // Reset counter when back to 0 or 1 person
                multiPersonCountRef.current = 0;
                setMultiPersonChecks(0);

                // ── 0 persons → start missing timer ──────────────────────────
                if (persons.length === 0) {
                    if (!faceMissingTimerRef.current) {
                        faceMissingTimerRef.current = setTimeout(() => {
                            faceMissingTimerRef.current = null;
                            recordSecurityEvent("FACE_MISSING", SECURITY_MESSAGES.FACE_MISSING);
                            // Record as a non-submit security event
                        }, FACE_MISSING_SECS * 1000);
                    }
                } else {
                    // exactly 1 person – clear missing timer
                    if (faceMissingTimerRef.current) {
                        clearTimeout(faceMissingTimerRef.current);
                        faceMissingTimerRef.current = null;
                    }
                }
            }

            // ════════════════════════════════════════════════════════════════
            // 2. PROHIBITED ELECTRONIC DEVICE DETECTION ANALYSIS
            // ════════════════════════════════════════════════════════════════
            const detectedDevices = predictions.filter(
                (p) =>
                    PROHIBITED_DEVICE_CLASSES.includes(p.class) &&
                    p.score >= DEVICE_CONFIDENCE_THRESHOLD
            );

            if (detectedDevices.length > 0) {
                // Select device with highest confidence score
                const topDevice = detectedDevices.reduce((prev, curr) =>
                    curr.score > prev.score ? curr : prev
                );

                deviceDetectionCountRef.current += 1;
                const currentCount = deviceDetectionCountRef.current;
                const confPercent  = Math.round(topDevice.score * 100);

                setDetectedDevice(topDevice.class);
                setDeviceConfidence(confPercent);
                setDeviceChecks(currentCount);

                // Check consecutive confirmation limit
                if (currentCount >= DEVICE_CONFIRM_LIMIT) {
                    stopDetection();
                    handleSecurityAutoSubmit("PROHIBITED_ELECTRONIC_DEVICE_DETECTED", {
                        device:     topDevice.class,
                        confidence: topDevice.score,
                    });
                    return;
                }
            } else {
                // No prohibited device in this frame -> reset consecutive counter
                deviceDetectionCountRef.current = 0;
                setDetectedDevice(null);
                setDeviceConfidence(0);
                setDeviceChecks(0);
            }
        }, 700); // analyse every 700 ms – fast enough to catch violations quickly
    }, [handleSecurityAutoSubmit, stopDetection, recordSecurityEvent]);

    // ────────────────────────────────────────────────────────────────────────
    // Web Audio API: suspicious audio detection (prototype heuristic)
    // ────────────────────────────────────────────────────────────────────────
    const startAudioMonitoring = useCallback(async (micStream) => {
        try {
            const ctx     = new (window.AudioContext || window.webkitAudioContext)();
            const source  = ctx.createMediaStreamSource(micStream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;

            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current     = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray    = new Uint8Array(bufferLength);

            audioIntervalRef.current = setInterval(() => {
                if (submittingRef.current) return;
                analyser.getByteTimeDomainData(dataArray);

                // RMS amplitude
                let sumSq = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const norm = (dataArray[i] - 128) / 128;
                    sumSq += norm * norm;
                }
                const rms = Math.sqrt(sumSq / bufferLength);

                if (rms > AUDIO_THRESHOLD) {
                    audioSustainedRef.current += 1;
                    if (audioSustainedRef.current >= AUDIO_SUSTAINED_SECS) {
                        stopAudio();
                        handleSecurityAutoSubmit("SUSPICIOUS_EXTERNAL_AUDIO");
                    }
                } else {
                    audioSustainedRef.current = 0; // reset on silence
                }
            }, 1000); // sample every 1 s
        } catch (e) {
            console.warn("Audio monitoring init failed:", e);
        }
    }, [handleSecurityAutoSubmit, stopAudio]);

    // ────────────────────────────────────────────────────────────────────────
    // Start assessment: permissions → fullscreen → detection → begin
    // ────────────────────────────────────────────────────────────────────────
    const handleStartAssessment = useCallback(async () => {
        setPermissionError("");
        setFullscreenDenied(false);

        // 1. Camera + mic
        let micStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            // Keep mic stream for audio monitoring; stop video tracks (webcam re-acquires)
            micStream.getVideoTracks().forEach((t) => t.stop());
            micStreamRef.current = micStream; // audio tracks kept alive
            setCameraActive(true);
        } catch {
            setPermissionError("Camera & Microphone access is required. Please allow permissions and try again.");
            return;
        }

        // 2. Fullscreen
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch {
            setFullscreenDenied(true);
            // Continue anyway (browser may have restricted fullscreen)
        }

        // 3. Begin session
        setHasStarted(true);
        recordSecurityEvent("START", "Assessment session started with full proctoring active");

        // 4. Launch detection (non-blocking)
        startPersonDetection();
        startAudioMonitoring(micStream);
    }, [recordSecurityEvent, startPersonDetection, startAudioMonitoring]);

    // ────────────────────────────────────────────────────────────────────────
    // Answer selection
    // ────────────────────────────────────────────────────────────────────────
    const handleSelectOption = useCallback((questionId, option) => {
        if (terminated || submitting) return;
        setAnswers((prev) => {
            const updated = { ...prev, [questionId]: option };
            answersRef.current = updated;
            return updated;
        });
    }, [terminated, submitting]);

    // ────────────────────────────────────────────────────────────────────────
    // Cleanup on unmount
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopTimer();
            stopDetection();
            stopAudio();
            exitFullscreen();
        };
    }, [stopTimer, stopDetection, stopAudio, exitFullscreen]);

    // ────────────────────────────────────────────────────────────────────────
    // Render: loading
    // ────────────────────────────────────────────────────────────────────────
    if (loading) return <LoadingSpinner message="Generating AI Skill Assessment..." />;

    // ────────────────────────────────────────────────────────────────────────
    // Render: onboarding screen
    // ────────────────────────────────────────────────────────────────────────
    if (!hasStarted) {
        return (
            <div className="assessment-wrapper">
                <div className="assessment-header-bar">
                    <div className="assessment-title-group">
                        <h1><FaRocket /> CareerPath AI Skill Assessment</h1>
                        <span>Adaptive Multi-Domain Diagnostic</span>
                    </div>
                    <button className="btn-secondary" onClick={() => navigate("/student/dashboard")}>
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="assessment-onboarding-container">
                    <div className="onboarding-card">
                        <div className="onboarding-icon"><FaShieldAlt /></div>
                        <h2>Secure Assessment – Readiness Check</h2>
                        <p className="onboarding-desc">
                            This assessment tests Python, JavaScript, and DSA to diagnose your skill
                            gaps and generate a personalized curriculum roadmap.
                        </p>

                        <div className="fullscreen-notice">
                            <FaLock className="fullscreen-notice-icon" />
                            <p>
                                <strong>Zero-tolerance integrity policy.</strong> Any of the following
                                events will <strong>immediately and permanently submit your assessment</strong>:
                                switching tabs, minimizing the browser, switching applications, exiting
                                fullscreen, multiple persons detected, prohibited electronic devices (e.g. mobile phones, laptops), or sustained external audio.
                                There is no resume option.
                            </p>
                        </div>

                        <div className="proctoring-guidelines-grid">
                            {[
                                [FaVideo,       "Live Camera + AI"],
                                [FaMobileAlt,   "No Mobile / Devices"],
                                [FaShieldAlt,   "Fullscreen Enforced"],
                                [FaExpand,      "Tab Switch → Submit"],
                                [FaEye,         "Multi-Person Detect"],
                                [FaClock,       "15-Minute Timer"],
                            ].map(([Icon, label], i) => (
                                <div key={i} className="proctoring-rule-item">
                                    <Icon /><span>{label}</span>
                                </div>
                            ))}
                        </div>

                        {permissionError && (
                            <div className="alert-box error" style={{ marginBottom: "20px" }}>
                                <FaExclamationTriangle /><span>{permissionError}</span>
                            </div>
                        )}
                        {fullscreenDenied && (
                            <div className="alert-box error" style={{ marginBottom: "20px" }}>
                                <FaExclamationTriangle />
                                <span>Fullscreen permission was denied. The assessment will still run but exiting fullscreen will auto-submit it.</span>
                            </div>
                        )}

                        <button
                            className="btn-primary"
                            style={{ padding: "14px 36px", fontSize: "1.05rem" }}
                            onClick={handleStartAssessment}
                        >
                            <FaLock /> Enable Camera &amp; Start Secure Assessment →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // Render: active assessment
    // ────────────────────────────────────────────────────────────────────────
    const currentQuestion = questions[currentIndex] || {};
    const answeredCount   = Object.keys(answers).length;

    return (
        <div className={`assessment-wrapper assessment-secure-mode${terminated ? " assessment-terminated" : ""}`}>

            {/* ── TERMINAL OVERLAY (shown when security event fires) ───────── */}
            {terminated && (
                <div className="terminal-overlay" role="alertdialog" aria-modal="true">
                    <div className="terminal-modal">
                        <div className="terminal-modal-icon"><FaExclamationTriangle /></div>
                        <h2>Assessment Terminated</h2>
                        <p className="terminal-modal-subtitle">
                            {USER_MESSAGES[termReason] || USER_MESSAGES.default}
                        </p>
                        <div className="terminal-detail-box">
                            <span className="terminal-detail-label">Security Event</span>
                            <span className="terminal-detail-value">{termReason}</span>
                        </div>
                        <p className="terminal-redirect-note">
                            Submitting your answers and redirecting to the dashboard…
                        </p>
                    </div>
                </div>
            )}

            {/* ── SECURE TOPBAR ────────────────────────────────────────────── */}
            <header className="assessment-header-bar secure-header">
                <div className="assessment-title-group">
                    <h1><FaRocket /> Skill Diagnostic Assessment</h1>
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                </div>

                <div className="secure-status-strip">
                    <div className={`secure-indicator${isFullscreen ? "" : " not-fullscreen"}`}>
                        <FaLock />
                        <span>{isFullscreen ? "🔒 Secure Mode Active" : "⚠ Fullscreen Off"}</span>
                    </div>
                    <div className="timer-badge">
                        <FaClock /><span>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <button
                    className="btn-primary"
                    style={{ padding: "8px 20px" }}
                    onClick={() => handleSubmit(false)}
                    disabled={submitting || terminated}
                >
                    <FaCheck /> {submitting ? "Submitting…" : "Submit Test"}
                </button>
            </header>

            {/* ── MAIN WORKSPACE ───────────────────────────────────────────── */}
            <div className="assessment-workspace-grid">

                {/* LEFT: question pane */}
                <div className="assessment-question-pane">
                    <div className={`question-status-card${terminated ? " question-pane-blurred" : ""}`}>
                        <div className="question-meta-row">
                            <span className="question-number-tag">
                                Question {currentIndex + 1} • {currentQuestion.skill}
                            </span>
                            <span className={`badge badge-${currentQuestion.difficulty?.toLowerCase()}`}>
                                {currentQuestion.difficulty}
                            </span>
                        </div>

                        <h2 className="question-text-title" onDragStart={(e) => e.preventDefault()}>
                            {currentQuestion.question}
                        </h2>

                        <div className="options-list-grid">
                            {(currentQuestion.options || []).map((option, idx) => {
                                const isSelected = answers[currentQuestion._id] === option;
                                return (
                                    <div
                                        key={idx}
                                        className={`option-choice-btn${isSelected ? " selected" : ""}${terminated ? " option-disabled" : ""}`}
                                        onClick={() => handleSelectOption(currentQuestion._id, option)}
                                    >
                                        <div className="option-key-indicator">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span>{option}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="question-nav-bar">
                            <button
                                className="btn-secondary"
                                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                                disabled={currentIndex === 0 || terminated}
                            >
                                <FaArrowLeft /> Previous
                            </button>
                            <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                                {answeredCount} / {questions.length} Answered
                            </span>
                            <button
                                className="btn-primary"
                                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                                disabled={currentIndex === questions.length - 1 || terminated}
                            >
                                Next <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: proctoring + palette */}
                <div className="assessment-sidebar-pane">
                    {/* Camera */}
                    <div className="proctoring-camera-card">
                        <div className="camera-header-status">
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="live-dot" />
                                Live Proctoring
                            </span>
                            <FaShieldAlt color="#38bdf8" />
                        </div>
                        <div className="camera-feed-container">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                mirrored={true}
                                videoConstraints={{ facingMode: "user", width: 320, height: 240 }}
                                onUserMediaError={() =>
                                    recordSecurityEvent("CAMERA_STOPPED", SECURITY_MESSAGES.CAMERA_STOPPED)
                                }
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {/* Device detection warning overlay */}
                            {deviceChecks > 0 && !terminated && (
                                <div className="camera-device-warning-badge">
                                    <FaExclamationTriangle />
                                    <span>
                                        {detectedDevice === "cell phone" ? "CELL PHONE" : detectedDevice?.toUpperCase()} DETECTED ({deviceChecks}/{DEVICE_CONFIRM_LIMIT})
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ── DEBUG / PROCTORING STATUS PANEL ──────────────── */}
                        <div className="proctoring-debug-panel">
                            <div className="debug-row">
                                <span className={`debug-dot ${cameraActive ? "dot-green" : "dot-red"}`} />
                                <span>Camera: {cameraActive ? "Active" : "Inactive"}</span>
                            </div>
                            <div className="debug-row">
                                <span className={`debug-dot ${
                                    modelStatus === "active" ? "dot-green" :
                                    modelStatus === "loading" ? "dot-yellow" : "dot-red"
                                }`} />
                                <span>AI Detection: {{
                                    active:  "Active",
                                    loading: "Loading model…",
                                    error:   "Failed to load",
                                }[modelStatus]}</span>
                            </div>
                            <div className="debug-row">
                                <span>👥</span>
                                <span>Persons Detected: <strong style={{
                                    color: personsDetected >= 2 ? "#fb7185" : "#34d399",
                                }}>{personsDetected}</strong></span>
                            </div>
                            <div className="debug-row">
                                <span>{multiPersonChecks > 0 ? "⚠️" : "✅"}</span>
                                <span>Person Security Check: <strong style={{
                                    color: multiPersonChecks > 0 ? "#fbbf24" : "var(--text-muted)",
                                }}>{multiPersonChecks} / {PERSON_CONFIRM_LIMIT}</strong></span>
                            </div>
                            <div className="debug-row">
                                <span>📱</span>
                                <span>Prohibited Device: <strong style={{
                                    color: detectedDevice ? "#fb7185" : "#34d399",
                                    textTransform: "capitalize",
                                }}>{detectedDevice ? (detectedDevice === "cell phone" ? "Cell Phone" : detectedDevice) : "None"}</strong></span>
                            </div>
                            <div className="debug-row">
                                <span>🔍</span>
                                <span>Device Confidence: <strong style={{
                                    color: deviceConfidence > 0 ? "#fbbf24" : "var(--text-muted)",
                                }}>{deviceConfidence > 0 ? `${deviceConfidence}%` : "--"}</strong></span>
                            </div>
                            <div className="debug-row">
                                <span>{deviceChecks > 0 ? "⚠️" : "🛡️"}</span>
                                <span>Device Security Check: <strong style={{
                                    color: deviceChecks > 0 ? "#fb7185" : "var(--text-muted)",
                                }}>{deviceChecks} / {DEVICE_CONFIRM_LIMIT}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Question palette */}
                    <div className="palette-card">
                        <h3>Question Navigator</h3>
                        <div className="palette-grid">
                            {questions.map((q, idx) => (
                                <button
                                    key={q._id}
                                    className={`palette-btn${currentIndex === idx ? " active" : ""}${answers[q._id] ? " answered" : ""}`}
                                    onClick={() => !terminated && setCurrentIndex(idx)}
                                    disabled={terminated}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Security event log */}
                    <div className="integrity-log-card">
                        <span style={{ fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                            Security Log ({securityEventsRef.current.length} events)
                        </span>
                        <div className="integrity-log-list">
                            {securityEventsRef.current.slice(-5).map((e, i) => (
                                <div key={i} style={{
                                    fontSize: "0.7rem",
                                    color: e.type === "START" ? "var(--text-muted)" : "#fb7185",
                                }}>
                                    • [{e.type}]
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Assessment;
