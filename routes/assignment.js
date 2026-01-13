const express = require("express");
const router = express.Router();
const Controller = require("../controllers/assignmentcontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");
const upload = require("../middleware/Upload")
const Controll = require("../controllers/lecturecontroller");
// TEACHER CREATE ASSIGNMENT
router.post("/create", Auth, Role("teacher"), Controller.createAssignment);

// STUDENT SUBMIT ASSIGNMENT
router.post("/submit", Auth, upload.single("file"),Role("student"), Controller.submitAssignment);
//student result
router.get(
  "/student/results",
  Auth,Controller.
  getStudentResults
);
// TEACHER GRADE SUBMISSION
router.post("/grade", Auth, Role("teacher"), Controller.gradeSubmission);
//student assignments
router.get("/assignments", Auth, Controller.getAssignmentsForStudent);
//teacher get assignments
router.get("/", Auth, Controller.getSubmissionsForTeacher);
// teacher create upload lecture
router.post("/lecture", Auth, upload.single("video"),Role("teacher"), Controll.createLecture);
module.exports = router;
