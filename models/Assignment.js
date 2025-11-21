import mongoose from "mongoose";
const assignmentSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true
    },
    Discription: {
      type: String,
      required: true,
      trim: true
    },
    FinalAt: {
      type: Date,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    //    only teacher by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }

  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);