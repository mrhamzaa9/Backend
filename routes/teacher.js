const express = require("express");
const router = express.Router();
const SchoolController = require("../controllers/schoolcontroller");
const AuthMiddleware = require("../middleware/Auth")
const RoleMiddleware = require("../middleware/Role")
router.post("/teacher/request", AuthMiddleware,RoleMiddleware("teacher"),UserController.requestToJoinSchool);
router.post("/teacher/approve", AuthMiddleware,RoleMiddleware("schooladmin"), UserController.approveTeacher);
router.get("/schools",SchoolController.getSchool);
router.post ("/create-assignment")
module.exports = router;