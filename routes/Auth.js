const express = require("express");
const router = express.Router();
const UserController = require("../controllers/authcontroller");
//register as a user
router.post("/register", UserController.register);
//login as a user
router.post("/login", UserController.login);

module.exports = router;
