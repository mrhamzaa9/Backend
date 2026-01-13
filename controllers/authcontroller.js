const User = require("../models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require("crypto"); // for random token
const validator = require('validator');
const School = require("../models/school");
const {sendVerificationEmail,sendResetPasswordEmail} = require("../config/mail")
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;


const register = async (req, res) => {
  try {
    const { name, email, password, role, school } = req.body; // include optional school info

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!validator.isEmail(normalizedEmail) || !normalizedEmail.endsWith("@gmail.com")) {
      return res.status(400).json({ error: "Email must be a valid Gmail address" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role.trim(),
      verificationToken
    });

    // If schooladmin and school data is provided
    if (role.trim().toLowerCase() === "schooladmin" && school) {
      if (!school.name || !school.address) {
        return res.status(400).json({ error: "School name and address are required for School Admin" });
      }

      const newSchool = new School({
        name: school.name,
        address: school.address,
        createdBy: user._id,
        teachers: [],
        students: [],
        courses: [],
        pendingTeachers: []
      });

      await newSchool.save();

      // Link school to user
      user.schools.push(newSchool._id);
    }

    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify account.",
      userId: user._id,
      ...(user.role === "schooladmin" && user.schools.length ? { schoolId: user.schools[0] } : {})
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


//login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "EMAIL NOT REGISTER" })
        }
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(401).json({ message: "WRONG PASSWORD" })
        }
        // if (!user.isVerified) {
        //     return res.status(401).json({ message: "Please verify your email before logging in." });
        // }

        //  assign token
        const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, secretKey, { expiresIn: "24h" });
        res.cookie("token", token);
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
// verify email by nodemailer
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ message: "Invalid token" });

        user.isVerified = true;
        user.verificationToken = undefined; // clear token
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  // Compare new password with existing password
  const isSame = await bcrypt.compare(password, user.password);
  if (isSame) {
    return res.status(400).json({ message: "New password cannot be same as old password" });
  }

  // Hash and save new password
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: "Password updated successfully. You can now login." });
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // create token
  const token = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min

  await user.save();

  const resetUrl = `http://localhost:5173/reset-password/${token}`;

  await sendResetPasswordEmail(user, resetUrl);

  res.json({ message: "Reset link sent to email" });
};
// LOGOUT
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Logout failed",
    });
  }
};

module.exports = { login, register, verifyEmail,resetPassword,forgotPassword, logout }