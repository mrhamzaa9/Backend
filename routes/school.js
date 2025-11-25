const express = require("express");
const router = express.Router();
const UserController = require("../controllers/schoolcontroller");
const AuthMiddleware = require("../middleware/Auth")
const RoleMiddleware = require("../middleware/Role")
router.post("/create", AuthMiddleware, RoleMiddleware("schooladmin"), UserController.AddSchool );
router.post("/teacher/request", AuthMiddleware,RoleMiddleware("teacher"),UserController.requestToJoinSchool);
router.post("/teacher/approve", AuthMiddleware,RoleMiddleware("teacher"), UserController.approveTeacher);
router.post("/student/select", AuthMiddleware, RoleMiddleware("student"),UserController.selectSchool);
module.exports = router;
