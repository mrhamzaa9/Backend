const Anthropic = require('@anthropic-ai/sdk');
const QuizResult = require("../models/quiz");
const Enrollment = require("../models/enrollment")
const GeneratedQuiz = require("../models/GeneratedQuiz");
require("dotenv").config();

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const getQuizQuestions = async (req, res) => {
  try {
    const { topic = "javascript", difficulty = "medium" } = req.body;

    // A. Ask Claude to generate the quiz
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0.2,
      system: "Return ONLY valid JSON. No text. No markdown.",
      messages: [
        {
          role: "user",
          content: `Generate 3 ${difficulty} MCQ about ${topic}.
Format:
[{id, question, options[4], correctAnswer}]`
        }
      ]
    });

    // B. Parse the response
    let questionsData;
    try {
      questionsData = JSON.parse(response.content[0].text);
    } catch (e) {
      throw new Error("Failed to parse AI response: " + e.message);
    }

    // C. Save the FULL quiz (with answers) to MongoDB
    const newQuizSession = await GeneratedQuiz.create({
      createdBy: req.user._id, // required
      topic,                    // required
      difficulty,
      questions: questionsData
    });

    // D. Sanitize for Frontend (Remove correct answers!)
    const safeQuestions = questionsData.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    // E. Send Questions + The Quiz Session ID
    res.json({
      success: true,
      quizId: newQuizSession._id, // Frontend must send this back when submitting!
      questions: safeQuestions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ================= SUBMIT QUIZ =================
const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const studentId = req.user._id;

    console.log("➡️ Received submission:", JSON.stringify({ quizId, answers }, null, 2));

    const quizSession = await GeneratedQuiz.findById(quizId);
    if (!quizSession) {
      console.log("❌ Quiz not found for ID:", quizId);
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Map correct answers by question ID
    const correctMap = {};
    quizSession.questions.forEach(q => {
      // Ensure both correct answer and options are strings
      correctMap[q.id] = q.correctAnswer?.toString() || "";
    });

    console.log("✅ Correct answer map:", JSON.stringify(correctMap, null, 2));

    let score = 0;
    const detailedAnswers = answers.map(ans => {
      const selectedText = (ans.selected || "").toString();
      const correct = correctMap[ans.questionId];

      // Compare lowercase trimmed to avoid extra whitespace issues
      const isCorrect =
        correct &&
        selectedText.trim().toLowerCase() === correct.trim().toLowerCase();

      if (isCorrect) score++;

      console.log(
        `🔹 Question ID: ${ans.questionId}, Selected: "${selectedText}", Correct: "${correct}", isCorrect: ${isCorrect}`
      );

      return {
        questionId: ans.questionId,
        selected: selectedText,
        correctAnswer: correct,
        isCorrect
      };
    });

    console.log("🏁 Final score:", score);
    console.log("📋 Detailed answers:", JSON.stringify(detailedAnswers, null, 2));

    // Save result in DB
    const result = await QuizResult.create({
      studentId,
      quizId,
      score,
      total: quizSession.questions.length,
      answers: detailedAnswers
    });

    res.json({
      success: true,
      correct: score,
      total: quizSession.questions.length,
      result
    });
  } catch (err) {
    console.error("submitQuiz error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= GET SAVED QUIZ =================
const getSavedQuiz = async (req, res) => {
  const { quizId } = req.params;
  const quiz = await GeneratedQuiz.findById(quizId);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  const safeQuestions = quiz.questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }));

  res.json({
    success: true,
    quizId,
    questions: safeQuestions,
  });
};

// ================= LIST TEACHER QUIZZES =================
const listTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const quizzes = await GeneratedQuiz.find({ createdBy: teacherId }).sort({ createdAt: -1 });

    const safeQuizzes = quizzes.map(q => ({
      _id: q._id,
      topic: q.topic || "N/A",
      difficulty: q.difficulty || "medium",
      isActive: q.isActive,
      createdAt: q.createdAt,
      totalQuestions: q.questions.length,
    }));

    res.json(safeQuizzes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= LIST AVAILABLE QUIZZES FOR STUDENT =================
const listAvailableQuizzes = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1️⃣ Get enrolled courses from Enrollment collection
    const enrollments = await Enrollment.find({ studentId })
      .select("courseId");

    if (!enrollments.length) {
      return res.json([]);
    }

    const enrolledCourseIds = enrollments.map(e => e.courseId);

    // 2️⃣ Get quizzes for those courses
    const quizzes = await GeneratedQuiz.find({
      isActive: true,
      courseId: { $in: enrolledCourseIds },
    }).sort({ createdAt: -1 });

    // 3️⃣ Safe response
    const safeQuizzes = quizzes.map(q => ({
      _id: q._id,
      topic: q.topic || "N/A",
      difficulty: q.difficulty || "medium",
      totalQuestions: q.questions.length,
    }));

    res.json(safeQuizzes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = {
  getQuizQuestions,
  submitQuiz,
  getSavedQuiz,
  listTeacherQuizzes,
  listAvailableQuizzes
};
