const mongoose = require('mongoose');
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
      lowercase: true,
      validate: {
        validator: function (v) {
          return validator.isEmail(v) && v.endsWith('@gmail.com');
        },
        message: props => `${props.value} is not a valid Gmail address!`,
      },
    },

    password: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["superadmin", "schooladmin", "teacher", "student"],
      required: true,
    },

    // IMPORTANT: teacher/student can join many schools
    schools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
