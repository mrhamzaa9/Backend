const Enrollment = require("../models/enrollment");
const Course = require("../models/course");

const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrollment = await Enrollment.create({
      studentId: req.user._id,
      courseId,
    });

    return res.status(201).json({ message: "Enrolled", enrollment });
  } catch (err) {
    //IN MONGO DB IF YOU CHECK ALREADY HA TU USKO 11000 CODE SA KRATE HAN 
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const myCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate("courseId");

    return res.json(enrollments);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { enrollCourse, myCourses };
