# CareerPath AI – AI-Based Personalized Learning Recommendation Platform

**CareerPath AI** is a full-stack, AI-powered educational platform designed for hackathon demonstrations, smart learning recommendations, and individualized tech career progression.

---

## 🌟 Key Features

1. **AI Skill Diagnostic & Proctoring**:
   - In-browser camera & microphone monitoring via `react-webcam`.
   - Real-time integrity event logging (window blur, tab-switch detection).
   - Multi-domain assessment covering **Python**, **JavaScript**, and **Data Structures & Algorithms (DSA)**.

2. **Real-Time Skill Gap Analysis**:
   - Dynamic classification into **Strong (Low Priority)**, **Moderate (Medium Priority)**, and **Needs Improvement (High Priority)**.
   - Live synchronization with MongoDB.

3. **Personalized Dynamic Career Roadmap**:
   - Step-by-step curriculum milestones customized according to the learner's career target, role, and assessment scores.

4. **Interactive Learning & Quizzes**:
   - Deep-dive lesson modules with syntax-highlighted interactive code snippets.
   - "Mark as Complete" persistence updating real database progress.
   - Topic quizzes with instant feedback, scoring, and performance recommendations.

5. **Multi-Role Support**:
   - **Student**: Comprehensive diagnostic dashboard, roadmaps, learning tracks, and progress XP.
   - **Faculty**: Class performance analytics, student roster, institutional skill gap averages, and assessment history.
   - **Individual Learner**: Professional career pivot roadmap and targeted competencies.

6. **Authentication & Biometric Enrollment**:
   - Email/password JWT authentication with protected routes.
   - Google Sign-In with `@react-oauth/google` and Google Token verification.
   - Consent-based facial reference enrollment.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection string (already configured in `.env`)

### 1. Backend Setup
```bash
cd server
npm install
npm run seed     # Seeds 30 questions (Python, JS, DSA) and courses into MongoDB
npm start        # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

### 3. Run Automated End-to-End Test Suite
```bash
cd server
node test_e2e.js # Runs complete 12-step test suite validating all database models & APIs
```

---

## 📡 API Endpoints Summary

- `POST /api/auth/register` — Multi-role user registration with face reference
- `POST /api/auth/login` — User authentication returning JWT token
- `POST /api/auth/google` — Google OAuth authentication
- `GET /api/assessment/questions` — Fetches balanced diagnostic questions
- `POST /api/assessment/submit` — Submits assessment answers and integrity log
- `GET /api/assessment/latest` — Fetches user's latest assessment scores
- `GET /api/skill-gap` — Computes skill status and priority levels
- `GET /api/roadmap` — Generates dynamic career curriculum roadmap
- `POST /api/course-progress/complete` — Records completed lesson in database
- `GET /api/course-progress/all` — Retrieves all user course progress
- `POST /api/quiz/result` — Submits topic quiz score
- `GET /api/quiz/results` — Retrieves past quiz results
- `GET /api/profile/faculty/analytics` — Class analytics for faculty role
