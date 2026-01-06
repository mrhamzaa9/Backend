const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "teacher-request",          // 🔔 new request (admin)
        "teacher-request-status",   // ✅ approved / ❌ rejected (teacher)
        "new-assignment",           // 📝 new assignment (student)
        "assignment-submitted",     // 📤 assignment submitted (teacher)
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // 🔥 IMPORTANT
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },

    schoolName: String,

    message: {
      type: String,
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
