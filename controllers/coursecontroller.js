const Course = require("../models/course");
const School = require("../models/school");
const User = require("../models/user");

// CREATE COURSE ( SchoolAdmin)
const createCourse = async (req, res) => {
  try {
    const { name, schoolId } = req.body;

    if (!name || !schoolId) {
      return res.status(400).json({ message: "Name & schoolId are required" });
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    // Only teachers approved in this school can create course
    if (req.user.role === "teacher" && !school.teachers.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not approved teacher of this school" });
    }

    // Create course
    const course = await Course.create({
      name,
      schoolId,
      teachers: [req.user._id],
    });

    // Add course to school
    school.courses.push(course._id);
    await school.save();

    return res.status(201).json({ message: "Course created", course });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ASSIGN TEACHER TO COURSE (school admin)
const assignTeacher = async (req, res) => {
  try {
    const { courseId, teacherId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Only teacher role can be assigned
    if (teacher.role !== "teacher") {
      return res.status(400).json({ message: "User is not a teacher" });
    }

    // Add teacher to course
    if (!course.teachers.includes(teacherId)) {
      course.teachers.push(teacherId);
      await course.save();
    }
  
    return res.json({ message: "Teacher assigned to course", course });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL COURSES OF A SCHOOL
const getSchoolCourses = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const courses = await Course.find({ schoolId }).populate(
      "teachers",
      "name email"
    );

    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET COURSES FOR A TEACHER
const getTeacherCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teachers: req.user._id });
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET COURSES FOR STUDENT (in selected school)
const getStudentCourses = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const courses = await Course.find({ schoolId });

    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createCourse,
  assignTeacher,
  getSchoolCourses,
  getTeacherCourses,
  getStudentCourses,
};
