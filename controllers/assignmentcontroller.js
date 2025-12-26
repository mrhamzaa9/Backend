const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment"); // assuming you have an enrollment model
// TEACHER CREATE ASSIGNMENT
const createAssignment = async (req, res) => {
  try {
    const { task, description, finalAt, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }



    const assignment = await Assignment.create({
      task,
      description,
      finalAt,
      courseId,
      schoolId: course.schoolId, 
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Assignment created", assignment });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// STUDENT SUBMIT ASSIGNMENT
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    // 🛑 File validation
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    // 🛑 Prevent duplicate submission
    const alreadySubmitted = await Submission.findOne({
      assignmentId,
      studentId: req.user._id,
    });

    if (alreadySubmitted) {
      return res.status(400).json({ message: "Already submitted" });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user._id,
      fileUrl: req.file.path, // Cloudinary URL
    });

    res.json({
      message: "Assignment submitted successfully",
      submission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// FETCH ASSIGNMENTS FOR STUDENT
// GET /api/assign/assignments
const getAssignmentsForStudent = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1️⃣ Get all enrolled courses
    const enrollments = await Enrollment.find({ studentId }).select("courseId");
    const courseIds = enrollments.map(e => e.courseId);

    // 2️⃣ Fetch all assignments for those courses
    const assignments = await Assignment.find({ courseId: { $in: courseIds } });

    // 3️⃣ Mark submitted assignments
    for (let a of assignments) {
      const submission = await Submission.findOne({
        assignmentId: a._id,
        studentId,
      });
      a.submitted = !!submission;
    }

    res.json({ assignments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
    return res.status(500).json({ error: err.message });
  }
};
const getSubmissionsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const submissions = await Submission.find()
      .populate({
        path: "assignmentId",
        match: { createdBy: teacherId }, // ONLY teacher's assignments
        populate: { path: "courseId", select: "name" },
      })
      .populate("studentId", "name email");

    // remove null assignments (not teacher's)
    const filtered = submissions.filter(s => s.assignmentId);

    res.json({ submissions: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};// STUDENT VIEW RESULTS (ASSIGNMENTS + GRADES)
const getStudentResults = async (req, res) => {
  try {
    const studentId = req.user._id;

    const submissions = await Submission.find({ studentId })
      .populate({
        path: "assignmentId",
        select: "task description finalAt courseId",
        populate: { path: "courseId", select: "name" },
      });

    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = { createAssignment,getAssignmentsForStudent, submitAssignment, gradeSubmission,getSubmissionsForTeacher,  getStudentResults  };
