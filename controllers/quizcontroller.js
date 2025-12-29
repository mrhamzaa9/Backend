
const Anthropic = require("@anthropic-ai/sdk");
const GeneratedQuiz = require("../models/GeneratedQuiz");
const QuizResult = require("../models/quiz");
require("dotenv").config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate or fetch quiz
const getQuizQuestions = async (req, res) => {
  try {
    const { quizId, topic = "javascript", difficulty = "medium" } = req.body;

    let quiz;

    if (quizId) {
      quiz = await GeneratedQuiz.findById(quizId);
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    } else {
      // Generate new quiz via AI
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL,
        max_tokens: 400,
        temperature: 0.2,
        system: "Return ONLY valid JSON. No text. No markdown.",
        messages: [
          {
            role: "user",
            content: `Generate 3 ${difficulty} MCQ about ${topic}.
Format: [{id, question, options[4], correctAnswer}]`
          }
        ]
      });

      let questionsData;
      try {
        questionsData = JSON.parse(response.content[0].text);
      } catch (e) {
        throw new Error("Failed to parse AI response: " + e.message);
      }

      quiz = await GeneratedQuiz.create({
        createdBy: req.user._id,
        topic,
        difficulty,
        questions: questionsData
      });
    }

    const safeQuestions = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    res.json({ success: true, quizId: quiz._id, questions: safeQuestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit quiz
const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const studentId = req.user._id;

    const quiz = await GeneratedQuiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    const detailedAnswers = answers.map(ans => {
      const correct = quiz.questions.find(q => q.id === ans.questionId)?.correctAnswer || "";
      const isCorrect = correct.trim().toLowerCase() === (ans.selected || "").trim().toLowerCase();
      if (isCorrect) score++;
      return { questionId: ans.questionId, selected: ans.selected, correctAnswer: correct, isCorrect };
    });

    const result = await QuizResult.create({
      studentId,
      quizId,
      score,
      total: quiz.questions.length,
      answers: detailedAnswers
    });

    res.json({ success: true, correct: score, total: quiz.questions.length, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Teacher: list own quizzes
const listTeacherQuizzes = async (req, res) => {
  try {
    const quizzes = await GeneratedQuiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    const safeQuizzes = quizzes.map(q => ({
      _id: q._id,
      topic: q.topic,
      difficulty: q.difficulty,
      totalQuestions: q.questions.length
    }));
    res.json(safeQuizzes);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Student: list all quizzes
const listStudentQuizzes = async (req, res) => {
  try {
    const quizzes = await GeneratedQuiz.find({}).sort({ createdAt: -1 });
    const safeQuizzes = quizzes.map(q => ({
      _id: q._id,
      topic: q.topic,
      difficulty: q.difficulty,
      totalQuestions: q.questions.length
    }));
    res.json(safeQuizzes);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getQuizQuestions, submitQuiz, listTeacherQuizzes, listStudentQuizzes };
