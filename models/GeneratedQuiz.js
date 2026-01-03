const mongoose = require("mongoose");

const generatedQuizSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true, // 🔥 REQUIRED
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  questions: [
    {
      id: { type: String, required: true },
      question: { type: String, required: true },
      options: {
        type: [String],
        validate: v => v.length === 4,
        required: true,
      },
      correctAnswer: { type: String, required: true },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GeneratedQuiz", generatedQuizSchema);
