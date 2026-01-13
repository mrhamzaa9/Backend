const Lecture = require("../models/lecture");
const Course = require("../models/course");
const School = require("../models/school");
const { sendLectureMail } = require("../config/mail");

const createLecture = async (req, res) => {
  try {
    const { title, courseId, schoolId } = req.body;
    const teacherId = req.user._id;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload lectures" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Lecture video is required" });
    }

    const videoUrl = req.file.path;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    const isApprovedTeacher = school.teachers.some(
      (t) => t.teacher.toString() === teacherId.toString() &&
             t.courseIds.includes(courseId)
    );
    if (!isApprovedTeacher) {
      return res.status(403).json({ message: "You are not assigned to this course" });
    }

    const newLecture = await Lecture.create({
      title,
      videoUrl,
      courseId,          // ✅ match schema
      schoolId,          // ✅ match schema
      teachers: teacherId // ✅ match schema
    });

    res.status(201).json({
      message: "Lecture created successfully",
      lecture: newLecture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createLecture };

