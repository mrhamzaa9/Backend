const express = require("express");
const router = express.Router();
const SchoolController = require("../controllers/superadmincontroller");
const AuthMiddleware = require("../middleware/Auth")
const RoleMiddleware = require("../middleware/Role")
// delete the schools
router.delete("/delete/:id",SchoolController.DeleteSchool,AuthMiddleware, RoleMiddleware("superadmin"));
// delete the users
router.delete("/user/delete/:id",SchoolController.DeleteUser,AuthMiddleware, RoleMiddleware("superadmin")); 
// total users
router.get("/totalusers",SchoolController.totalUsers,AuthMiddleware, RoleMiddleware("superadmin"));
//get all schools
router.get("/",SchoolController.GetSchool);
module.exports = router;