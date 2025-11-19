import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true 
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },

    teachers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    students: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
