const QuizResult = require("../models/quiz");


// SUBMIT QUIZ
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;

    let score = 0;

    if (!global.quizAnswerMap) {
      return res.status(400).json({ message: "Quiz not initialized" });
    }

    answers.forEach(ans => {
      const correct = global.quizAnswerMap[ans.questionId];

      console.log(
        "Q:", ans.questionId,
        "Correct:", correct,
        "Selected:", ans.selected
      );

      if (correct === ans.selected) {
        score++;
      }
    });

    const result = await QuizResult.create({
      score,
      total: answers.length,
    });

    res.json({
      success: true,
      correct: score,
      total: answers.length,
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getQuizQuestions = async (req, res) => {
  try {
    const { limit = 10, difficulty = "easy" } = req.query;

    const url = new URL("https://the-trivia-api.com/v2/questions");
    url.searchParams.append("limit", limit);
    url.searchParams.append("difficulties", difficulty);

    const response = await fetch(url);
    const data = await response.json();
a
    // ✅ STORE CORRECT ANSWERS (SERVER ONLY)
    global.quizAnswerMap = {};

    const questions = data.map(q => {
      global.quizAnswerMap[q.id] = q.correctAnswer;

      console.log("Saving:", q.id, q.correctAnswer);

      return {
        id: q.id,
        question: q.question.text,
        options: [...q.incorrectAnswers, q.correctAnswer].sort(),
        category: q.category,
      };
    });

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports ={getQuizQuestions,submitQuiz}