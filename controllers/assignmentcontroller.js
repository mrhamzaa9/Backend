const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Course = require("../models/course");

// TEACHER CREATE ASSIGNMENT
const createAssignment = async (req, res) => {
  try {
    const { task, description, finalAt, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // only course teacher can create
    if (!course.teachers.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const assignment = await Assignment.create({
      task,
      description,
      finalAt,
      courseId,
      createdBy: req.user._id,
    });

    return res.status(201).json({ message: "Assignment created", assignment });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// STUDENT SUBMIT ASSIGNMENT
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, fileUrl } = req.body;

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user._id,
      fileUrl,
    });

    return res.json({ message: "Submitted", submission });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// TEACHER GRADE SUBMISSION
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId, grade } = req.body;

    const submission = await Submission.findById(submissionId).populate("assignmentId");

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // only the assignment creator teacher can grade
    if (String(submission.assignmentId.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    submission.grade = grade;
    await submission.save();

    return res.json({ message: "Graded", submission });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createAssignment, submitAssignment, gradeSubmission };
