// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/chartdatacontroller');
const authMiddleware  = require('../middleware/auth'); // middleware to attach req.user

// Super Admin
router.get('/superadmin', authMiddleware, async (req, res) => {
  try {
    const data = await getDashboardData({ role: 'superadmin' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// School Admin
router.get("/schooladmin", authMiddleware, async (req, res) => {
  try {
    const data = await getDashboardData({
      role: req.user.role,
      userId: req.user._id,
      schoolId: req.user.schoolId, 
    });

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Teacher
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    const data = await getDashboardData({ role: 'teacher', userId: req.user._id.toString() });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student (use logged-in user ID)
router.get('/student', authMiddleware, async (req, res) => {
  try {
    if (!req.user) throw new Error("Unauthorized");
    const data = await getDashboardData({ role: 'student', userId: req.user._id.toString() });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
