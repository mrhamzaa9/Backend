const User = require("../models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require("crypto"); // for random token
const validator = require('validator');
const {sendVerificationEmail} = require("../config/mail")
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;


const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
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

        // generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: role.trim(),
            verificationToken
        });

        await user.save();

        // send verification email
        await sendVerificationEmail(user, verificationToken);

        res.status(201).json({
            message: "User registered successfully. Please check your email to verify account.",
            userId: user._id
        });

    } catch (error) {
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
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email before logging in." });
        }

        //  assign token
        const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, secretKey, { expiresIn: "24h" });
        res.cookie("token", token);
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
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

module.exports = { login, register, verifyEmail }