import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FaRocket, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        const savedEmail = localStorage.getItem("careerpath_remember_email");
        if (savedEmail) {
            setFormData((prev) => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const redirectUser = (user) => {
        if (user.userType === "Faculty") {
            navigate("/student/dashboard");
        } else {
            navigate("/student/dashboard");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!formData.email || !formData.password) {
            setMessage({ text: "Email and password are required.", type: "error" });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/login", formData);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            if (rememberMe) {
                localStorage.setItem("careerpath_remember_email", formData.email);
            } else {
                localStorage.removeItem("careerpath_remember_email");
            }

            setMessage({ text: "Login successful! Redirecting...", type: "success" });

            setTimeout(() => {
                redirectUser(response.data.user);
            }, 500);
        } catch (error) {
            console.error("Login Error:", error);
            setMessage({
                text: error.response?.data?.message || "Invalid credentials. Please check and try again.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setMessage({ text: "Verifying Google account...", type: "info" });

            const response = await api.post("/auth/google", {
                credential: credentialResponse.credential,
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            setMessage({ text: "Google login successful! Redirecting...", type: "success" });

            setTimeout(() => {
                redirectUser(response.data.user);
            }, 500);
        } catch (error) {
            console.error("Google Login Error:", error);
            setMessage({
                text: error.response?.data?.message || "Google authentication failed.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setMessage({
            text: "Google sign-in was interrupted or failed. Please try again.",
            type: "error",
        });
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-brand">
                    <div className="login-brand-logo">
                        <FaRocket />
                    </div>
                    <h1>CareerPath AI</h1>
                    <p>AI-Powered Learning & Career Progression Platform</p>
                </div>

                <div className="login-card">
                    <div className="login-header-text">
                        <h2>Welcome Back!</h2>
                        <p>Sign in to access your customized skill path & dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="login-form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <FaEnvelope className="field-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-form-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <FaLock className="field-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="login-form-options">
                            <label className="remember-me-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>

                            <Link to="/register" style={{ fontSize: "0.85rem", color: "var(--primary-light)" }}>
                                Need an account?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary login-submit-btn"
                            disabled={loading}
                        >
                            {loading ? "Authenticating..." : "Sign In →"}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <div className="google-auth-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            text="continue_with"
                            width="100%"
                        />
                    </div>

                    {message.text && (
                        <div className={`alert-box ${message.type === "error" ? "error" : "success"}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="login-footer-text">
                        Don't have an account yet?{" "}
                        <Link to="/register" style={{ fontWeight: "700" }}>
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;