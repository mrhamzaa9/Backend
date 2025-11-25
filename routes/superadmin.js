const express = require("express");
const router = express.Router();
const SchoolController = require("../controllers/superadmincontroller");
const AuthMiddleware = require("../middleware/Auth")
const RoleMiddleware = require("../middleware/Role")
router.delete("/delete/:id",SchoolController.DeleteSchool,AuthMiddleware, RoleMiddleware("superAdmin"));
router.get("/",SchoolController.GetSchool);


module.exports = router;