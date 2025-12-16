const express = require("express");
const router = express.Router();
const SchoolController = require("../controllers/schoolcontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");

// SCHOOL ADMIN create school
router.post("/create", Auth, Role("schooladmin"), SchoolController.AddSchool);

// Teacher → request to join a school
router.post("/teacher/request", Auth, Role("teacher"), SchoolController.requestToJoinSchool);
 // School Admin → view teacher requests
router.get("/teacher/request", Auth, Role("schooladmin"), SchoolController.getTeacherRequests);
// School Admin → approve teacher
router.post("/teacher/approve", Auth, Role("schooladmin"), SchoolController.approveTeacher);
// Teacher → cancel own request
router.post("/teacher/cancel", Auth, Role("teacher"), SchoolController.cancelOwnRequest);

// Student → select school
router.post("/select", Auth, Role("student"), SchoolController.selectSchool);

// Student/Teacher → view all schools
router.get("/", Auth, SchoolController.getSchool);

module.exports = router;

