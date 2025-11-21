import mongoose from "mongoose";
const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },

    submittedAt: {
      type: Date,
      default: Date.now
    },

    grade: {
      type: Number,
      default: null
    },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
