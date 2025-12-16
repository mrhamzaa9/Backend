const express = require("express");
const router = express.Router();
const CourseController = require("../controllers/coursecontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");

//  SCHOOLADMIN CREATE COURSE
router.post("/create", Auth, Role("schooladmin"), CourseController.createCourse);
// deletecourse
router.delete("/course/:deleteId",Auth,Role("schooladmin"),CourseController.deleteCourse)
// VIEW SCHOOL COURSES
router.get("/school/:schoolId", Auth, CourseController.getSchoolCourses);

// TEACHER VIEW COURSES
router.get("/teacher/coursesWithSchool", Auth, Role("teacher,schooladmin"), CourseController.getTeacherCoursesWithSchool);

// STUDENT VIEW COURSES
router.get("/student/:schoolId", Auth, Role("student"), CourseController.getStudentCourses);

module.exports = router;
