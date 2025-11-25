const express = require("express");
const router = express.Router();
const UserController = require("../controllers/schoolcontroller");
const AuthMiddleware = require("../middleware/Auth")
const RoleMiddleware = require("../middleware/Role")
router.post("/create", AuthMiddleware, RoleMiddleware("schooladmin"), UserController.AddSchool );


module.exports = router;
