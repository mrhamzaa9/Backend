// models/GeneratedQuiz.js
const mongoose = require("mongoose");

const generatedQuizSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  questions: [
    {
      id: { type: String, required: true },
      question: { type: String, required: true },
      options: { type: [String], validate: v => v.length === 4, required: true },
      correctAnswer: { type: String, required: true },
    }
  ]
});

module.exports = mongoose.model("GeneratedQuiz", generatedQuizSchema);
