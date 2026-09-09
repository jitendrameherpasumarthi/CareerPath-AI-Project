import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaRocket,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserTie,
    FaUser,
    FaEnvelope,
    FaLock,
    FaPhone,
    FaUniversity,
    FaIdCard,
    FaBuilding,
    FaBriefcase,
    FaEye,
    FaEyeSlash,
    FaBullseye,
} from "react-icons/fa";
import api from "../services/api";
import FaceCapture from "../components/FaceCapture";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [role, setRole] = useState("Student"); // "Student" | "Faculty" | "Individual"
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        // Student Fields
        collegeName: "",
        rollNumber: "",
        branch: "",
        yearOfStudy: "1",
        // Faculty Fields
        employeeId: "",
        department: "",
        designation: "",
        // Individual Fields
        occupation: "",
        organization: "",
        careerGoal: "Software Developer",
        // Face Biometric
        faceImage: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFaceCapture = (imageSrc) => {
        setFormData((prev) => ({
            ...prev,
            faceImage: imageSrc,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!formData.name || !formData.email || !formData.password) {
            setMessage({ text: "Please fill in all required account credentials.", type: "error" });
            return;
        }

        if (formData.password.length < 6) {
            setMessage({ text: "Password must be at least 6 characters long.", type: "error" });
            return;
        }

        if (!formData.faceImage) {
            // Face scan is strongly recommended but not blocking
            const confirmSkip = window.confirm(
                "⚠️ Face scanning is recommended for proctored assessments.\n\nProceed without face scan? (You can add it later)"
            );
            if (!confirmSkip) return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                userType: role,
                role: role,
                branch: role === "Faculty" ? formData.department : formData.branch,
            };

            const response = await api.post("/auth/register", payload);

            setMessage({
                text: response.data.message || "Registration successful! Redirecting to login...",
                type: "success",
            });

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration Error:", error);
            setMessage({
                text: error.response?.data?.message || "Registration failed. Please try again.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-brand">
                    <div className="register-brand-logo">
                        <FaRocket />
                    </div>
                    <h1>Join CareerPath AI</h1>
                    <p>AI-Powered Skill Assessment, Dynamic Roadmaps & Career Guidance</p>
                </div>

                <div className="register-card">
                    <div className="role-selector-title">Select Your Role</div>
                    <div className="role-selector-grid">
                        <div
                            className={`role-card ${role === "Student" ? "active" : ""}`}
                            onClick={() => setRole("Student")}
                        >
                            <div className="role-icon">
                                <FaUserGraduate />
                            </div>
                            <h3>Student</h3>
                            <p>College & University Learners</p>
                        </div>

                        <div
                            className={`role-card ${role === "Faculty" ? "active" : ""}`}
                            onClick={() => setRole("Faculty")}
                        >
                            <div className="role-icon">
                                <FaChalkboardTeacher />
                            </div>
                            <h3>Faculty</h3>
                            <p>Professors & Mentors</p>
                        </div>

                        <div
                            className={`role-card ${role === "Individual" ? "active" : ""}`}
                            onClick={() => setRole("Individual")}
                        >
                            <div className="role-icon">
                                <FaUserTie />
                            </div>
                            <h3>Individual</h3>
                            <p>Working Professionals & Switchers</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {/* Full Name */}
                            <div className="form-group">
                                <label>Full Name *</label>
                                <div className="input-wrapper">
                                    <FaUser className="field-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Rahul Sharma"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label>Email Address *</label>
                                <div className="input-wrapper">
                                    <FaEnvelope className="field-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="name@university.edu"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label>Password *</label>
                                <div className="input-wrapper">
                                    <FaLock className="field-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="At least 6 characters"
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

                            {/* Phone */}
                            <div className="form-group">
                                <label>Phone Number</label>
                                <div className="input-wrapper">
                                    <FaPhone className="field-icon" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="+91 9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* ================= ROLE SPECIFIC FIELDS ================= */}

                            {/* STUDENT FIELDS */}
                            {role === "Student" && (
                                <>
                                    <div className="form-group">
                                        <label>College / University Name *</label>
                                        <div className="input-wrapper">
                                            <FaUniversity className="field-icon" />
                                            <input
                                                type="text"
                                                name="collegeName"
                                                placeholder="e.g. IIT Delhi / VJTI"
                                                value={formData.collegeName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Roll Number / College ID *</label>
                                        <div className="input-wrapper">
                                            <FaIdCard className="field-icon" />
                                            <input
                                                type="text"
                                                name="rollNumber"
                                                placeholder="e.g. 21CS1042"
                                                value={formData.rollNumber}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Branch / Department *</label>
                                        <div className="input-wrapper">
                                            <FaUniversity className="field-icon" />
                                            <input
                                                type="text"
                                                name="branch"
                                                placeholder="e.g. Computer Science & Engineering"
                                                value={formData.branch}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Year of Study *</label>
                                        <div className="input-wrapper" style={{ paddingLeft: 0 }}>
                                            <select
                                                name="yearOfStudy"
                                                value={formData.yearOfStudy}
                                                onChange={handleChange}
                                                style={{ paddingLeft: "14px" }}
                                            >
                                                <option value="1">1st Year</option>
                                                <option value="2">2nd Year</option>
                                                <option value="3">3rd Year</option>
                                                <option value="4">4th Year</option>
                                                <option value="Postgraduate">Postgraduate</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* FACULTY FIELDS */}
                            {role === "Faculty" && (
                                <>
                                    <div className="form-group">
                                        <label>College / University Name *</label>
                                        <div className="input-wrapper">
                                            <FaUniversity className="field-icon" />
                                            <input
                                                type="text"
                                                name="collegeName"
                                                placeholder="e.g. National Institute of Technology"
                                                value={formData.collegeName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Employee / Faculty ID *</label>
                                        <div className="input-wrapper">
                                            <FaIdCard className="field-icon" />
                                            <input
                                                type="text"
                                                name="employeeId"
                                                placeholder="e.g. FAC-2024-88"
                                                value={formData.employeeId}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Department *</label>
                                        <div className="input-wrapper">
                                            <FaBuilding className="field-icon" />
                                            <input
                                                type="text"
                                                name="department"
                                                placeholder="e.g. Computer Science & Information Tech"
                                                value={formData.department}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Designation *</label>
                                        <div className="input-wrapper">
                                            <FaBriefcase className="field-icon" />
                                            <input
                                                type="text"
                                                name="designation"
                                                placeholder="e.g. Associate Professor / HOD"
                                                value={formData.designation}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* INDIVIDUAL LEARNER FIELDS */}
                            {role === "Individual" && (
                                <>
                                    <div className="form-group">
                                        <label>Current Occupation / Status *</label>
                                        <div className="input-wrapper">
                                            <FaBriefcase className="field-icon" />
                                            <input
                                                type="text"
                                                name="occupation"
                                                placeholder="e.g. Junior Developer / Career Transitioner"
                                                value={formData.occupation}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Current Organization / Company</label>
                                        <div className="input-wrapper">
                                            <FaBuilding className="field-icon" />
                                            <input
                                                type="text"
                                                name="organization"
                                                placeholder="e.g. Infosys / Self-Employed"
                                                value={formData.organization}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Target Career Field *</label>
                                        <div className="input-wrapper">
                                            <FaBullseye className="field-icon" />
                                            <input
                                                type="text"
                                                name="careerGoal"
                                                placeholder="e.g. Full Stack Web Developer / AI Engineer"
                                                value={formData.careerGoal}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* FACE CAPTURE COMPONENT */}
                            <div className="form-group full-width">
                                <FaceCapture
                                    onCapture={handleFaceCapture}
                                    initialImage={formData.faceImage}
                                />
                            </div>
                        </div>

                        {message.text && (
                            <div
                                className={`alert-box ${message.type === "error" ? "error" : "success"}`}
                                style={{ marginTop: "18px" }}
                            >
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary submit-btn-full"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Register & Continue →"}
                        </button>
                    </form>

                    <div className="register-footer-text">
                        Already have an account?{" "}
                        <Link to="/login" style={{ fontWeight: "700" }}>
                            Sign In Here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;