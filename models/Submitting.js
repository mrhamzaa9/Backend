import mongoose from "mongoose";

const submittingSchema = new mongoose.Schema(
 {
 submission: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fileUrl: { type: String },
      submittedAt: { type: Date, default: Date.now },
      grade: { type: Number } 
      
    }
  ]
  },
  { timestamps: true }
);

export default mongoose.model("Submitting", submittingSchema);