const Enrollment = require("../models/enrollment");
const Course = require("../models/course");
const school = require("../models/school");

const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: req.user._id,
      courseId,
      schoolId: course.schoolId,
    });

    // Add student to school.students array
    await school.findByIdAndUpdate(course.schoolId, {
      $addToSet: { students: req.user._id }
    });

    return res.status(201).json({ message: "Enrolled", enrollment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    return res.status(500).json({ error: err.message });
  }
};


const myCourses = async (req, res) => {
 
const studentId = req.user._id;

  const enrollments = await Enrollment.find({ studentId }).populate("courseId");
  const courses = enrollments.map(e => e.courseId);

  res.json({ courses });
}

module.exports = { enrollCourse, myCourses };
