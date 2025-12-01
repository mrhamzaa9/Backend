const express = require("express");
const router = express.Router();
const Controller = require("../controllers/enrollmentcontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");

router.post("/", Auth, Role("student"), Controller.enrollCourse);
router.get("/my-course", Auth, Role("student"), Controller.myCourses);

module.exports = router;