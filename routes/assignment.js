const express = require("express");
const router = express.Router();
const Controller = require("../controllers/assignmentcontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");

// TEACHER CREATE ASSIGNMENT
router.post("/create", Auth, Role("teacher"), Controller.createAssignment);

// STUDENT SUBMIT ASSIGNMENT
router.post("/submit", Auth, Role("student"), Controller.submitAssignment);

// TEACHER GRADE SUBMISSION
router.post("/grade", Auth, Role("teacher"), Controller.gradeSubmission);
//student assignments
router.get("/assignments", Auth, Controller.getAssignmentsForStudent);
module.exports = router;
