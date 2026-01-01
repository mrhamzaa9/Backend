const mongoose = require('mongoose');
const User = require('../models/user');
const School = require('../models/school');
const Course = require('../models/course');
const Assignment = require('../models/assignment');
const Submission = require('../models/submission');
const Quiz = require('../models/quiz');
const Enrollment = require('../models/enrollment');

async function getDashboardData({ role, userId, schoolId }) {

  // Helper to safely get ObjectId
  const toObjectId = (id) => {
    if (!id) throw new Error("Invalid ID");
    return typeof id === "string" ? new mongoose.Types.ObjectId(id.trim()) : id;
  };

  switch (role) {

    case 'superadmin': {
      // Students per school
      const studentsPerSchool = await User.aggregate([
        { $match: { role: 'student' } },
        { $unwind: '$schools' },
        { $group: { _id: '$schools', count: { $sum: 1 } } },
        { $lookup: { from: 'schools', localField: '_id', foreignField: '_id', as: 'school' } },
        { $unwind: '$school' },
        { $project: { _id: 0, schoolName: '$school.name', count: 1 } },
      ]);

      // Teachers per school
      const teachersPerSchool = await User.aggregate([
        { $match: { role: 'teacher' } },
        { $unwind: '$schools' },
        { $group: { _id: '$schools', count: { $sum: 1 } } },
        { $lookup: { from: 'schools', localField: '_id', foreignField: '_id', as: 'school' } },
        { $unwind: '$school' },
        { $project: { _id: 0, schoolName: '$school.name', count: 1 } },
      ]);

      // Courses per school
      const coursesPerSchool = await School.aggregate([
        { $project: { name: 1, courseCount: { $size: '$courses' } } }
      ]);

      // Monthly student registrations
      const monthlyRegistrations = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: { 
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            count: { $sum: 1 }
          } 
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: { month: '$_id.month', year: '$_id.year', count: 1, _id: 0 } }
      ]);

      // Quiz average
      const quizAverage = await Quiz.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$score' } } },
        { $project: { _id: 0, avgScore: 1 } }
      ]);

      return { studentsPerSchool, teachersPerSchool, coursesPerSchool, monthlyRegistrations, quizAverage };
    }

    case 'schooladmin': {
      const schoolObjId = toObjectId(schoolId);

      const studentsCount = await User.countDocuments({ role: 'student', schools: schoolObjId });
      const teachersCount = await User.countDocuments({ role: 'teacher', schools: schoolObjId });

      const school = await School.findById(schoolObjId).populate('courses');
      const coursesCount = school?.courses?.length || 0;

      const assignments = await Assignment.find({ schoolId: schoolObjId });
      const totalAssignments = assignments.length;

      const submissions = await Submission.find({ assignmentId: { $in: assignments.map(a => a._id) } });
      const submittedCount = submissions.length;
      const pendingCount = totalAssignments - submittedCount;

      const monthlyRegistrations = await User.aggregate([
        { $match: { role: 'student', schools: schoolObjId } },
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: { month: '$_id.month', year: '$_id.year', count: 1, _id: 0 } }
      ]);

      return { studentsCount, teachersCount, coursesCount, submittedCount, pendingCount, monthlyRegistrations };
    }

    case 'teacher': {
      const teacherObjId = toObjectId(userId);

      const courses = await Course.find({ teachers: teacherObjId });
      const courseIds = courses.map(c => c._id);

      const studentsPerCourse = await Enrollment.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', studentCount: { $sum: 1 } } },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: { _id: 0, courseName: '$course.name', studentCount: 1 } }
      ]);

      const quizStats = await Quiz.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', avgScore: { $avg: '$score' } } },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: { _id: 0, courseName: '$course.name', avgScore: 1 } }
      ]);

      const assignments = await Assignment.find({ courseId: { $in: courseIds } });
      const assignmentIds = assignments.map(a => a._id);
      const submissionsCount = await Submission.countDocuments({ assignmentId: { $in: assignmentIds } });

      return { courses, studentsPerCourse, quizStats, submissionsCount };
    }

    case 'student': {
      const studentObjId = toObjectId(userId);

      // Enrollments
      const enrollments = await Enrollment.find({ studentId: studentObjId }).populate('courseId');
      const courses = enrollments.map(e => e.courseId);

      // Assignments
      const assignments = await Assignment.find({ courseId: { $in: courses.map(c => c._id) } });
      const assignmentIds = assignments.map(a => a._id);

      // Submissions
      const submissions = await Submission.find({ assignmentId: { $in: assignmentIds }, studentId: studentObjId });
      const submittedCount = submissions.length;
      const pendingCount = assignments.length - submittedCount;

      // Quiz results
      const quizResults = await Quiz.find({ studentId: studentObjId });

      return { courses, submittedCount, pendingCount, quizResults };
    }

    default:
      throw new Error('Invalid role');
  }
}

module.exports = { getDashboardData };
