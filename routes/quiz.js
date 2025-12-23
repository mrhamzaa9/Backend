const express = require("express");
const router = express.Router();
const Controller = require("../controllers/quizcontroller");
const Auth = require("../middleware/Auth");
router.get("/student", Auth,Controller. getQuizQuestions);
router.post("/submit", Auth,Controller. submitQuiz);

module.exports = router;
