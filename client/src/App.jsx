import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/Student/StudentDashboard";
import Assessment from "./pages/Assessment/Assessment";
import AssessmentHistory from "./pages/Assessment/AssessmentHistory";
import LearningPage from "./pages/Learning/LearningPage";
import QuizPage from "./pages/Quiz/QuizPage";
import QuizHistory from "./pages/Quiz/QuizHistory";
import CourseDetails from "./pages/Courses/CourseDetails";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Certificates from "./pages/Certificates/Certificates";
import VerifyCertificate from "./pages/Certificates/VerifyCertificate";
import ProtectedRoute from "./components/ProtectedRoute";
import StudyChatbot from "./components/StudyChatbot/StudyChatbot";


function App() {
    const isAuthenticated = Boolean(localStorage.getItem("token"));

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/student/dashboard" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Public Credential Verification */}
                <Route path="/verify/:verificationCode" element={<VerifyCertificate />} />
                <Route path="/verify" element={<VerifyCertificate />} />
                <Route path="/certificates/verify/:verificationCode" element={<VerifyCertificate />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/assessment" element={<Assessment />} />
                    <Route path="/assessment/history" element={<AssessmentHistory />} />
                    <Route path="/learning/:topic" element={<LearningPage />} />
                    <Route path="/quiz/history" element={<QuizHistory />} />
                    <Route path="/quiz/:topic" element={<QuizPage />} />
                    <Route path="/quiz" element={<QuizPage />} />
                    <Route path="/course/:courseId" element={<CourseDetails />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/certificates" element={<Certificates />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global floating AI Study Chatbot */}
            <StudyChatbot />
        </>
    );

}

export default App;