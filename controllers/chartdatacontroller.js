const mongoose = require("mongoose");
const User = require("../models/user");
const School = require("../models/school");
const Course = require("../models/course");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Quiz = require("../models/quiz");
const Enrollment = require("../models/enrollment");
const QuizResult = require("../models/GeneratedQuiz");



// Dashboard function
async function getDashboardData({ role, userId }) {
  // Helper to safely convert to ObjectId
  const toObjectId = (id) => {
    if (!id) throw new Error("Invalid ID");
    return typeof id === "string" ? new mongoose.Types.ObjectId(id.trim()) : id;
  };

  switch (role) {
    // ================= SUPERADMIN =================
    case "superadmin": {
      const studentsPerSchool = await User.aggregate([
        { $match: { role: "student" } },
        { $unwind: "$schools" },
        { $group: { _id: "$schools", count: { $sum: 1 } } },
        { $lookup: { from: "schools", localField: "_id", foreignField: "_id", as: "school" } },
        { $unwind: "$school" },
        { $project: { _id: 0, schoolName: "$school.name", count: 1 } },
      ]);

      const teachersPerSchool = await User.aggregate([
        { $match: { role: "teacher" } },
        { $unwind: "$schools" },
        { $group: { _id: "$schools", count: { $sum: 1 } } },
        { $lookup: { from: "schools", localField: "_id", foreignField: "_id", as: "school" } },
        { $unwind: "$school" },
        { $project: { _id: 0, schoolName: "$school.name", count: 1 } },
      ]);

      const coursesPerSchool = await School.aggregate([
        { $project: { name: 1, courseCount: { $size: "$courses" } } },
      ]);

      const monthlyRegistrations = await User.aggregate([
        { $match: { role: "student" } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $project: { month: "$_id.month", year: "$_id.year", count: 1, _id: 0 } },
      ]);

      const quizAverage = await Quiz.aggregate([
        { $group: { _id: null, avgScore: { $avg: "$score" } } },
        { $project: { _id: 0, avgScore: 1 } },
      ]);

      return { studentsPerSchool, teachersPerSchool, coursesPerSchool, monthlyRegistrations, quizAverage };
    }

    // ================= SCHOOLADMIN =================
   case 'schooladmin': {
  console.log("Fetching dashboard for schooladmin:", userId);

  // Find the school created by this admin
  const school = await School.findOne({ createdBy: userId })
    .populate('courses') // get course details
    .populate('students', 'name email'); // optional if you want student info

  if (!school) throw new Error("School not found");

  const schoolId = school._id;

  // ✅ Teachers: count approved teachers from school.teachers
  const teachersCount = school.teachers.length;

  // ✅ Students: count from school.students array
  const studentsCount = school.students.length;

  // ✅ Courses count
  const coursesCount = school.courses.length;

  // ✅ Assignments & submissions
  const assignments = await Assignment.find({ schoolId });
  const totalAssignments = assignments.length;

  const submissions = await Submission.find({
    assignmentId: { $in: assignments.map(a => a._id) }
  });
  const submittedCount = submissions.length;
  const pendingCount = totalAssignments - submittedCount;

  // ✅ Monthly student registrations (optional, using creation date)
  const monthlyRegistrations = await User.aggregate([
    { $match: { role: 'student', schools: schoolId } }, 
    { $group: { 
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 } 
      } 
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $project: { month: '$_id.month', year: '$_id.year', count: 1, _id: 0 } }
  ]);

  return {
    teachersCount,
    studentsCount,
    coursesCount,
    submittedCount,
    pendingCount,
    monthlyRegistrations
  };
}

  case 'teacher': {
  const teacherId = toObjectId(userId);

  // Find all schools where this teacher is approved
  const schools = await School.find({ "teachers.teacher": teacherId }).populate("courses");

  // Collect all courses from all their schools
  const courses = schools.flatMap((s) => s.courses || []);

  const courseIds = courses.map(c => c._id);

  // Students per course
  const studentsPerCourse = await Enrollment.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: '$courseId', studentCount: { $sum: 1 } } },
    { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { _id: 0, courseName: '$course.name', studentCount: 1 } }
  ]);

  // Quiz stats per course
  const quizStats = await Quiz.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: '$courseId', avgScore: { $avg: '$score' } } },
    { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { _id: 0, courseName: '$course.name', avgScore: 1 } }
  ]);

  // Submissions
  const assignments = await Assignment.find({ courseId: { $in: courseIds } });
  const assignmentIds = assignments.map(a => a._id);
  const submissionsCount = await Submission.countDocuments({ assignmentId: { $in: assignmentIds } });

  return { courses, studentsPerCourse, quizStats, submissionsCount };
}

case "student": {
  if (!userId) throw new Error("studentId is required");

  const studentObjectId = new mongoose.Types.ObjectId(userId.trim());

  // ================= ENROLLMENTS =================
  const enrollments = await Enrollment
    .find({ studentId: studentObjectId })
    .populate("courseId");

  const courses = enrollments
    .map(e => e.courseId)
    .filter(Boolean);

  if (!courses.length) {
    return {
      courses: [],
      submittedCount: 0,
      pendingCount: 0,
    };
  }

  // ================= ASSIGNMENTS =================
  const assignments = await Assignment.find({
    courseId: { $in: courses.map(c => c._id) }
  });

  const submissions = await Submission.find({
    assignmentId: { $in: assignments.map(a => a._id) },
    studentId: studentObjectId
  });

  const submittedCount = submissions.length;
  const pendingCount = Math.max(assignments.length - submittedCount, 0);

  // ================= QUIZ RESULTS (✅ FIXED) =================
     // Quiz results
      const quizResults = await Quiz.find({ studentId: studentObjectId });

      return { courses, submittedCount, pendingCount, quizResults };
    }

  r



  }}

module.exports = { getDashboardData };
