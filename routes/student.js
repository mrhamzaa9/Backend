const express = require("express");
const router = express.Router();
const SchoolController = require("../controllers/schoolcontroller");
const AuthMiddleware = require("../middleware/Auth")
const RoleMiddleware = require("../middleware/Role")
router.post("/select-school", AuthMiddleware, RoleMiddleware("student"), SchoolController.selectSchool);
router.get("/schools",SchoolController.getSchool);
router.post("/submit-assignment")
module.exports = router;