const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment"); // assuming you have an enrollment model
const { getIO } = require("../socket");
const Notification = require("../models/notification");
// TEACHER CREATE ASSIGNMENT
const createAssignment = async (req, res) => {
  try {
    const { task, description, finalAt, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const assignment = await Assignment.create({
      task,
      description,
      finalAt,
      courseId,
      schoolId: course.schoolId,
      createdBy: req.user._id,
    });

    // 🔥 NOTIFY STUDENTS
    const io = getIO();

    // 1️⃣ Get enrolled students
    const enrollments = await Enrollment.find({ courseId }).select("studentId");
    const studentIds = enrollments.map(e => e.studentId.toString());

    for (const studentId of studentIds) {
      // socket emit
      io.to(studentId).emit("new-assignment", {
        type: "new-assignment",
        assignmentId: assignment._id,
        courseId: course._id,
        task: assignment.task,
        message: `New assignment "${assignment.task}" posted for ${course.name}`,
      });

      // DB notification
      await Notification.create({
        userId: studentId,
        type: "new-assignment",
        status: "pending",
        schoolId: course.schoolId,
        schoolName: course.name,
        message: `New assignment "${assignment.task}" posted for ${course.name}`,
      });
    }

    res.status(201).json({ message: "Assignment created", assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// STUDENT SUBMIT ASSIGNMENT
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    // ✅ FETCH ASSIGNMENT (THIS FIXES ERROR)
    const assignment = await Assignment.findById(assignmentId)
      .populate("courseId", "name");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 🛑 Prevent duplicate submission
    const alreadySubmitted = await Submission.findOne({
      assignmentId,
      studentId: req.user._id,
    });

    if (alreadySubmitted) {
      return res.status(400).json({ message: "Already submitted" });
    }

    // ✅ Save submission
    const submission = await Submission.create({
      assignmentId,
      studentId: req.user._id,
      fileUrl: req.file.path,
    });

    // 🔥 NOTIFY TEACHER
    const io = getIO();

    io.to(String(assignment.createdBy)).emit("assignment-submitted", {
      type: "assignment-submitted",
      submissionId: submission._id,
      assignmentId: assignment._id,
      studentId: req.user._id,
      message: `Student ${req.user.name} submitted "${assignment.task}"`,
    });

    // 💾 DB notification
    await Notification.create({
      userId: assignment.createdBy,
      type: "assignment-submitted",
      status: "pending",
      schoolId: assignment.schoolId,
      schoolName: assignment.courseId?.name,
      message: `Student ${req.user.name} submitted "${assignment.task}"`,
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
