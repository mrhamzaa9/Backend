const express = require("express");
const router = express.Router();
const Controller = require("../controllers/quizcontroller");
const Auth = require("../middleware/Auth");

// Fetch a saved quiz (student)
router.get("/student/:quizId", Auth, Controller.getSavedQuiz);

// Submit quiz answers
router.post("/submit", Auth, Controller.submitQuiz);

// Teacher generates a new quiz (AI)
router.post("/teacher", Auth, Controller.getQuizQuestions);

// List all teacher-generated quizzes
router.get("/list/teacher", Auth, Controller.listTeacherQuizzes);
// teacher make quiz use ai
router.post("/student", Auth, Controller.getQuizQuestions);
// student vie w quiz
// routes/quiz.js
router.get("/list/student", Auth, Controller.listAvailableQuizzes);

module.exports = router;
