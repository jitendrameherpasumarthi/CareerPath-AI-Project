const http = require("http");
const app = require("./app");

async function runE2ETests() {
    console.log("==================================================");
    console.log("🚀 Starting CareerPath AI End-to-End Test Suite...");
    console.log("==================================================");

    const server = http.createServer(app);
    const TEST_PORT = 5050;

    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`Test server running on port ${TEST_PORT}\n`);

    const BASE_URL = `http://localhost:${TEST_PORT}/api`;

    let authToken = "";
    let testUserId = "";

    try {
        // 1. Health Check
        console.log("1. Testing Health Check Endpoint (/test)...");
        const healthRes = await fetch(`${BASE_URL}/test`);
        const healthData = await healthRes.json();
        console.log("  Response:", healthData);
        if (!healthData.success) throw new Error("Health check failed");
        console.log("  ✅ Health Check PASSED\n");

        // 2. Fetch Assessment Questions
        console.log("2. Testing Assessment Questions Endpoint (/assessment/questions)...");
        const questionsRes = await fetch(`${BASE_URL}/assessment/questions?count=12`);
        // Note: Protected endpoint needs auth token, let's register/login first
        console.log("  Status without auth:", questionsRes.status, "(Expected 401)");
        if (questionsRes.status !== 401) throw new Error("Expected 401 without auth");
        console.log("  ✅ Auth Protection PASSED\n");

        // 3. User Registration (Student)
        console.log("3. Testing User Registration (/auth/register)...");
        const testEmail = `test_student_${Date.now()}@careerpath.ai`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Ananya Sharma",
                email: testEmail,
                password: "SecurePassword123!",
                phone: "+91 9876543210",
                userType: "Student",
                collegeName: "IIT Bombay",
                rollNumber: "21CS1089",
                branch: "Computer Science",
                yearOfStudy: "3",
                faceImage: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...",
            }),
        });
        const regData = await regRes.json();
        console.log("  Register Response:", regData.message);
        if (!regData.success) throw new Error(`Registration failed: ${regData.message}`);
        console.log("  ✅ Registration PASSED\n");

        // 4. User Login
        console.log("4. Testing User Login (/auth/login)...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "SecurePassword123!",
            }),
        });
        const loginData = await loginRes.json();
        console.log("  Login User:", loginData.user?.name, "| Role:", loginData.user?.userType);
        if (!loginData.success || !loginData.token) throw new Error("Login failed");
        authToken = loginData.token;
        testUserId = loginData.user?.id;
        console.log("  ✅ Login & JWT Generation PASSED\n");

        const authHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };

        // 5. Fetch Assessment Questions (Authenticated)
        console.log("5. Testing Assessment Questions with Token (/assessment/questions)...");
        const authQuestionsRes = await fetch(`${BASE_URL}/assessment/questions?count=12`, {
            headers: authHeaders,
        });
        const questionsData = await authQuestionsRes.json();
        console.log(`  Received ${questionsData.questions?.length} balanced questions`);
        if (!questionsData.success || questionsData.questions.length === 0) {
            throw new Error("Failed to fetch questions with auth");
        }
        console.log("  ✅ Questions Retrieval PASSED\n");

        // 6. Submit Assessment
        console.log("6. Testing Assessment Submission (/assessment/submit)...");
        const testAnswers = questionsData.questions.map((q, idx) => ({
            questionId: q._id,
            // Select correct answer for even questions to create realistic score
            selectedAnswer: idx % 2 === 0 ? q.options[0] : q.options[1],
        }));

        const submitRes = await fetch(`${BASE_URL}/assessment/submit`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                answers: testAnswers,
                integrityEvents: [
                    { type: "start", message: "Assessment initiated" },
                    { type: "tab_switch", message: "Tab switch detected" },
                ],
            }),
        });
        const submitData = await submitRes.json();
        console.log("  Submit Result Total Score:", submitData.result?.totalScore, "%");
        console.log("  Skill Scores:", submitData.result?.skillScores);
        if (!submitData.success) throw new Error("Assessment submission failed");
        console.log("  ✅ Assessment Evaluation & Storage PASSED\n");

        // 7. Latest Assessment API
        console.log("7. Testing Latest Assessment API (/assessment/latest)...");
        const latestRes = await fetch(`${BASE_URL}/assessment/latest`, {
            headers: authHeaders,
        });
        const latestData = await latestRes.json();
        console.log("  Latest Assessment Score:", latestData.assessment?.totalScore, "%");
        if (!latestData.success || !latestData.assessment) throw new Error("Latest assessment not found");
        console.log("  ✅ Latest Assessment PASSED\n");

        // 8. Skill Gap Analysis API
        console.log("8. Testing Skill Gap Analysis API (/skill-gap)...");
        const skillGapRes = await fetch(`${BASE_URL}/skill-gap`, {
            headers: authHeaders,
        });
        const skillGapData = await skillGapRes.json();
        console.log("  Skill Gap Summary:", Object.keys(skillGapData.skillGap).map(k => `${k}: ${skillGapData.skillGap[k].status} (${skillGapData.skillGap[k].score}%)`).join(", "));
        if (!skillGapData.success || !skillGapData.skillGap) throw new Error("Skill gap analysis failed");
        console.log("  ✅ Skill Gap Analysis PASSED\n");

        // 9. Personalized Roadmap API
        console.log("9. Testing Personalized Roadmap API (/roadmap)...");
        const roadmapRes = await fetch(`${BASE_URL}/roadmap`, {
            headers: authHeaders,
        });
        const roadmapData = await roadmapRes.json();
        console.log(`  Generated ${roadmapData.roadmap?.length} tailored roadmap steps for ${roadmapData.careerGoal}`);
        if (!roadmapData.success || roadmapData.roadmap.length === 0) throw new Error("Roadmap generation failed");
        console.log("  ✅ Personalized Roadmap PASSED\n");

        // 10. Course Progress API
        console.log("10. Testing Course Progress API (/course-progress/complete & /all)...");
        const progRes = await fetch(`${BASE_URL}/course-progress/complete`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                courseId: "JavaScript Fundamentals",
                lesson: "Variables & Data Types",
            }),
        });
        const progData = await progRes.json();
        console.log("  Lesson Progress Saved:", progData.progress?.completedLessons);

        const allProgRes = await fetch(`${BASE_URL}/course-progress/all`, {
            headers: authHeaders,
        });
        const allProgData = await allProgRes.json();
        console.log("  Total Course Progress Tracked:", Object.keys(allProgData.progress));
        if (!allProgData.success) throw new Error("Course progress failed");
        console.log("  ✅ Course Progress & Lesson Completion PASSED\n");

        // 11. Quiz API
        console.log("11. Testing Quiz API (/quiz/result & /quiz/results)...");
        const quizSubmitRes = await fetch(`${BASE_URL}/quiz/result`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                topic: "JavaScript",
                score: 4,
                totalQuestions: 5,
            }),
        });
        const quizSubmitData = await quizSubmitRes.json();
        console.log("  Quiz Saved:", quizSubmitData.result?.topic, "Score:", quizSubmitData.result?.percentage, "%");

        const quizHistoryRes = await fetch(`${BASE_URL}/quiz/results`, {
            headers: authHeaders,
        });
        const quizHistoryData = await quizHistoryRes.json();
        console.log(`  Found ${quizHistoryData.results?.length} historical quiz submissions`);
        if (!quizHistoryData.success) throw new Error("Quiz submission failed");
        console.log("  ✅ Quiz Module PASSED\n");

        // 12. Faculty Analytics
        console.log("12. Testing Faculty Analytics API (/profile/faculty/analytics)...");
        const facultyRes = await fetch(`${BASE_URL}/profile/faculty/analytics`, {
            headers: authHeaders,
        });
        const facultyData = await facultyRes.json();
        console.log("  Faculty Analytics Summary: Total Students:", facultyData.analytics?.totalStudents, "| Class Avg:", facultyData.analytics?.averageClassScore, "%");
        if (!facultyData.success) throw new Error("Faculty analytics failed");
        console.log("  ✅ Faculty Analytics PASSED\n");

        console.log("==================================================");
        console.log("🎉 ALL 12 END-TO-END TESTS PASSED SUCCESSFULLY! 🎉");
        console.log("==================================================");

        server.close();
        process.exit(0);
    } catch (error) {
        console.error("\n❌ E2E TEST FAILED:", error.message);
        server.close();
        process.exit(1);
    }
}

runE2ETests();
