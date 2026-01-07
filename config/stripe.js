const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Course = require("../models/course");
const AuthMiddleware = require("../middleware/Auth");

router.post("/create-checkout-session", AuthMiddleware, async (req, res) => {
  try {
    const { courseId } = req.body;

    // 1️⃣ Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2️⃣ Validate price
    const price = Number(course.price);

    if (isNaN(price)) {
      return res.status(400).json({ message: "Invalid course price" });
    }

    // 3️⃣ Free course → skip Stripe
    if (price === 0) {
      return res.json({
        free: true,
        message: "Free course, no payment required",
      });
    }

    // 4️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100), // cents

            product_data: {
              name: course.name,
            },
          },
          quantity: 1,
        },
      ],

      success_url:
        "http://localhost:5173/student/payment-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        "http://localhost:5173/student/payment-cancel",

      metadata: {
        courseId: course._id.toString(),
        schoolId: course.schoolId.toString(),
        studentId: req.user._id.toString(),
      },
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
