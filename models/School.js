const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // SchoolAdmin who created this school
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Teachers approved to teach
    
  teachers: [
    {
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      courseIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
    },
  ],


    // Students who selected this school
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],

    // Join requests from teachers
   pendingTeachers: [
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
      }
    ]
  }
]
,
    // All courses in the school
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("School", schoolSchema);
