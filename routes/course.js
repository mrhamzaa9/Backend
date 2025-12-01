const express = require("express");
const router = express.Router();
const CourseController = require("../controllers/coursecontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");

// TEACHER / SCHOOLADMIN CREATE COURSE
router.post("/create", Auth, Role("schooladmin"), CourseController.createCourse);

// SCHOOL ADMIN ASSIGN TEACHER TO COURSE
router.post("/assign-teacher", Auth, Role("schooladmin"), CourseController.assignTeacher);

// VIEW SCHOOL COURSES
router.get("/school/:schoolId", Auth, CourseController.getSchoolCourses);

// TEACHER VIEW COURSES
router.get("/teacher", Auth, Role("teacher"), CourseController.getTeacherCourses);

// STUDENT VIEW COURSES
router.get("/student/:schoolId", Auth, Role("student"), CourseController.getStudentCourses);

module.exports = router;
