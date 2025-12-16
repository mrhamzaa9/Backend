const express = require("express");
const router = express.Router();
const Controller = require("../controllers/enrollmentcontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");
//studnt can enroll
router.post("/", Auth, Role("student"), Controller.enrollCourse);
//student check coures
router.get("/my-course", Auth, Role("student"), Controller.myCourses);

module.exports = router;