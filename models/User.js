import mongoose from "mongoose";
const validator = require('validator');
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Check if it's a valid email format AND specifically a Gmail domain
          return validator.isEmail(v) && v.endsWith('@gmail.com');
        },
        message: props => `${props.value} is not a valid Gmail address!`
      },

      lowercase: true
    },
    password: {
      type: String,
      trim: true,
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
