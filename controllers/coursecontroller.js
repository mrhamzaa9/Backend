const Course = require("../models/course");
const School = require("../models/school");
const User = require("../models/user");

// CREATE COURSE ( SchoolAdmin)

const createCourse = async (req, res) => {
  try {
    let { name, price } = req.body;

    // 1️⃣ Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Course name is required" });
    }
    if (price == null || price === 0) {
      return res.status(400).json({ message: "free course" });
    }

    name = name.trim(); // remove extra spaces

    // 2️⃣ Role validation
    if (req.user.role !== "schooladmin") {
      return res.status(403).json({
        message: "Only School Admin can create courses"
      });
    }

    // 3️⃣ Find school for this admin
    const school = await School.findOne({ createdBy: req.user._id });

    if (!school) {
      return res.status(404).json({
        message: "School not found for this admin"
      });
    }

    // 4️⃣ Case-insensitive duplicate check (same school)
    const existingCourse = await Course.findOne({
      schoolId: school._id,
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "Course with this name already exists in your school"
      });
    }

    // 5️⃣ Create course
    const course = await Course.create({
      name,
      price,
      schoolId: school._id,
      createdBy: req.user._id,
      teachers: []
    });

    // 6️⃣ Push course to school
    school.courses.push(course._id);
    await school.save();

    return res.status(201).json({
      message: "Course created successfully",
      course
    });

  } catch (err) {
    console.error("Create course error:", err);
    return res.status(500).json({
      error: err.message 
    });
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

// GET COURSES FOR A TEACHER WITH SCHOOL INFO
const getTeacherCoursesWithSchool = async (req, res) => {
  try {
    const courses = await Course.find({ teachers: req.user._id }).populate(
      "schoolId",
      "name address" // add fields you want to show about the school
    );

    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};



// DELETE COURSE (Only School Admin)
const deleteCourse = async (req, res) => {
  try {
    const  {id } = req.params;
    console.log(id)

    // 1. Only School Admin can delete
    if (req.user.role !== "schooladmin") {
      return res.status(403).json({
        message: "Only School Admin can delete courses"
      });
    }

    // 2. Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 3. Check that this admin owns the school
    const school = await School.findOne({
      _id: course.schoolId,
      createdBy: req.user._id,
    });

    if (!school) {
      return res.status(403).json({
        message: "You are not authorized to delete courses from this school"
      });
    }

    // 4. Remove the course from School.courses list
    school.courses = school.courses.filter(
      (id) => id.toString() !== id
    );
    await school.save();

    // 5. Delete the course
    await Course.findByIdAndDelete(id);

    return res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const getSchoolsWithCourses = async (req, res) => {
  try {
    // Fetch all schools
    const schools = await School.find()
      .populate({
        path: "courses", // assuming School schema has courses: [ObjectId]
        select: "name createdBy teachers", // fields you want
        populate: {
          path: "teachers",
          select: "name email"
        }
      });

    return res.json(schools);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  createCourse,
  getSchoolsWithCourses,
deleteCourse,
  getSchoolCourses,

  getTeacherCoursesWithSchool
};
