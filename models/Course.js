import mongoose from "mongoose";
const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },
    //teacher id from user
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
