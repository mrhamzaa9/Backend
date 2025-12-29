const express = require("express");
const router = express.Router();
const Controller = require("../controllers/quizcontroller");
const Auth = require("../middleware/Auth");



// Submit quiz answers
router.post("/submit", Auth, Controller.submitQuiz);

// Teacher generates a new quiz (AI)
router.post("/teacher", Auth, Controller.getQuizQuestions);

// List all teacher-generated quizzes
router.get("/list/teacher", Auth, Controller.listTeacherQuizzes);
// teacher make quiz use ai
router.post("/student", Auth, Controller.getQuizQuestions);
// student vie w quiz


module.exports = router;
