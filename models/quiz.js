const mongoose = require('mongoose');
const quizResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  score: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Quiz", quizResultSchema);