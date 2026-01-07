const express = require("express");
const router = express.Router();
const Controller = require("../controllers/enrollmentcontroller");
const Auth = require("../middleware/Auth");
const Role = require("../middleware/Role");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // ✅ add this

// Student can enroll
router.post("/", Auth, Role("student"), Controller.enrollCourse);

// Student check courses
router.get("/my-course", Auth, Role("student"), Controller.myCourses);

router.get("/me", Auth, Role("student"), Controller.getMyStudentState);

// Get Stripe session (no Auth required for payment success)
router.get("/session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
