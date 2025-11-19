import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
         type: String, 
        required: true 
    },
    email: {
         type: String,
         required: true,
        unique: true 
    },
    password: { 
        type: String, 
        required: true
     },

    role: {
      type: String,
      enum: ["superAdmin", "schoolAdmin", "teacher", "student"],
      required: true
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
