const User = require("../models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('validator');
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const cleanRole = role.trim();
        // Validate email format + domain
        if (!validator.isEmail(normalizedEmail) || !normalizedEmail.endsWith("@gmail.com")) {
            return res.status(400).json({ error: "Email must be a valid Gmail address" });
        }
        // Check existing user
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: cleanRole,
      
        });
        await user.save();
        return res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            res.status(404).json({ message: "EMAIL NOT REGISTER" })
        }
        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            res.status(401).json({ message: "WRONG PASSWORD" })
        }
        
        //  assign token
        const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, secretKey, { expiresIn: "20h" });
        res.cookie("token", token);
        res.json({ token, user: { id: user._id, name: user.name, role: user.role, schoolId: user.schoolId } });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
module.exports = { login, register }