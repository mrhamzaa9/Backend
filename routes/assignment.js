const express = require("express");
const router = express.Router();
const Controller = require("../controllers/assignmentController");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");

// TEACHER CREATE ASSIGNMENT
router.post("/create", Auth, Role("teacher"), Controller.createAssignment);

// STUDENT SUBMIT ASSIGNMENT
router.post("/submit", Auth, Role("student"), Controller.submitAssignment);

// TEACHER GRADE SUBMISSION
router.post("/grade", Auth, Role("teacher"), Controller.gradeSubmission);

module.exports = router;
