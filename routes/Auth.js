const express = require("express");
const router = express.Router();
const UserController = require("../controllers/authcontroller");
//register as a user
router.post("/register", UserController.register);
//login as a user
router.post("/login", UserController.login);
// Email verification (AUTH route)
router.get("/verify/:token", UserController.verifyEmail);
//forgt
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password/:token",UserController. resetPassword);
// logout
router.post("/logout", UserController.logout);
module.exports = router;
