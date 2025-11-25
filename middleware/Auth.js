const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const secretKey = process.env.SECRET_KEY;

const authenticateWithToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, secretKey);

        // Fetch user from DB
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Attach to request
        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

module.exports = authenticateWithToken;
