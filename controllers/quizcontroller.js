const Anthropic = require('@anthropic-ai/sdk');
const QuizResult = require("../models/quiz");
const GeneratedQuiz = require("../models/GeneratedQuiz"); // Import the new model
require("dotenv").config();
// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Ensure this is in your .env file
});
// 1. GET QUESTIONS (Generates via Claude & Saves to DB)
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


// 2. SUBMIT QUIZ (Checks against DB)
const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const studentId = req.user._id;
    // A. Fetch the original quiz from DB
    const quizSession = await GeneratedQuiz.findById(quizId);
    if (!quizSession) {
      return res.status(404).json({ message: "Quiz session expired or invalid." });
    }

    // B. Calculate Score
    let score = 0;

    // Create a map for fast lookup: { "q1": "Answer A", "q2": "Answer B" }
    const correctMap = {};
    quizSession.questions.forEach(q => {
      correctMap[q.id] = q.correctAnswer;
    });

    answers.forEach(ans => {
      if (correctMap[ans.questionId] === ans.selected) {
        score++;
      }
    });

    // C. Save Result
    const result = await QuizResult.create({
      studentId,
      score,
      total: quizSession.questions.length,
    });

    res.json({
      success: true,
      correct: score,
      total: quizSession.questions.length,
      result,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET SAVED QUIZ
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


// ================= LIST QUIZZES (Teacher) =================
const listTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user._id; // teacher must be logged in

    // Fetch all quizzes created by this teacher
    const quizzes = await GeneratedQuiz.find({ createdBy: teacherId }).sort({ createdAt: -1 });

    // Return only relevant info for the dashboard
    const safeQuizzes = quizzes.map((q) => ({
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

// ================= UPDATE QUIZ (Edit / Deactivate) =================
const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { topic, difficulty, isActive } = req.body;

    const quiz = await GeneratedQuiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Ensure only the creator can edit
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update fields if provided
    if (topic) quiz.topic = topic;
    if (difficulty) quiz.difficulty = difficulty;
    if (typeof isActive === "boolean") quiz.isActive = isActive;

    await quiz.save();

    res.json({ success: true, message: "Quiz updated", quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
const listAvailableQuizzes = async (req, res) => {
  try {
    const quizzes = await GeneratedQuiz.find({ isActive: true }).sort({ createdAt: -1 });
    const safeQuizzes = quizzes.map((q) => ({
      _id: q._id,
      topic: q.topic || "N/A",
      difficulty: q.difficulty || "medium",
      totalQuestions: q.questions.length,
    }));
    res.json(safeQuizzes);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};





module.exports = { getQuizQuestions, submitQuiz,getSavedQuiz ,listTeacherQuizzes, updateQuiz,listAvailableQuizzes };