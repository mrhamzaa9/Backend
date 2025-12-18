const Notification = require("../models/notification");
const course = require("../models/course");
const School = require("../models/school");
const User = require("../models/user");
const { getIO } = require("../socket");

// ================= ADD SCHOOL =================
const AddSchool = async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingSchool = await School.findOne({ createdBy: req.user._id });
    if (existingSchool) {
      return res.status(400).json({
        message: "You already have a registered school with this account",
      });
    }

    const school = new School({
      name,
      address,
      createdBy: req.user._id,
      teachers: [],
      students: [],
      pendingTeachers: [],
      courses: [],
    });

    req.user.schools.push(school._id);
    await school.save();

    res.status(201).json({
      message: "School registered successfully",
      school,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ================= REQUEST TO JOIN =================
const requestToJoinSchool = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can send join requests" });
    }

    const { schoolId, courseIds } = req.body;

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    // Safely check if teacher is already approved
    const isAlreadyTeacher = school.teachers.some(
      (t) => t.teacher && t.teacher.toString() === req.user._id.toString()
    );
    if (isAlreadyTeacher) {
      return res.status(400).json({ message: "Already a teacher in this school" });
    }

    // ✅ Allow multiple pending requests
    school.pendingTeachers.push({
      teacher: req.user._id,
      courseIds: courseIds || [],
    });

    await school.save();

    return res.status(200).json({ message: "Join request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// ================= GET PENDING REQUESTS =================
const getTeacherRequests = async (req, res) => {
  try {
    const school = await School.findOne({ createdBy: req.user._id })
      .populate("pendingTeachers.teacher", "name email")
      .populate("pendingTeachers.courseIds", "name");

    if (!school) return res.status(404).json({ message: "School not found" });

    const pendingTeachersWithSchool = school.pendingTeachers.map((t) => ({
      _id: t._id,                 // requestId
      teacherId: t.teacher?._id,  // 🔧 FIX: send teacherId
      name: t.teacher?.name,
      email: t.teacher?.email,
      schoolId: school._id,
      courseIds: t.courseIds,
    }));

    res.json(pendingTeachersWithSchool);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= CANCEL OWN REQUEST =================
const cancelOwnRequest = async (req, res) => {
  try {
    const { schoolId } = req.body;
    const teacherId = req.user._id;

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    school.pendingTeachers = school.pendingTeachers.filter(
      (t) => t.teacher.toString() !== teacherId.toString()
    );

    await school.save();
    res.json({ message: "Your request has been canceled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= APPROVE / REJECT =================


const approveTeacher = async (req, res) => {
  try {
    const { schoolId, teacherId, approve } = req.body;

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    const index = school.pendingTeachers.findIndex(
      (p) => p.teacher.toString() === teacherId.toString()
    );

    if (index === -1) return res.status(400).json({ message: "Pending request not found" });

    const pendingRequest = school.pendingTeachers[index];

    // Remove from pending
    school.pendingTeachers.splice(index, 1);

    const io = getIO();

    if (approve === false) {
      // Notify teacher about rejection
      await Notification.create({
        userId: teacherId,
        type: "teacher-request-status",
        status: "rejected",
        schoolId,
        schoolName: school.name,
        message: `Your request to join ${school.name} was rejected`,
      });

      io.to(teacherId.toString()).emit("teacher-request-status", {
        status: "rejected",
        schoolId,
        schoolName: school.name,
        message: `Your request to join ${school.name} was rejected`,
      });

      await school.save();
      return res.json({ message: "Teacher request rejected" });
    }

    // ✅ APPROVE: Only allow courses that are not already assigned
    const assignedCourses = school.teachers.flatMap(t => t.courseIds.map(c => c.toString()));
    const requestedCourses = pendingRequest.courseIds.map(c => c.toString());

    const overlapping = requestedCourses.filter(c => assignedCourses.includes(c));
    if (overlapping.length > 0) {
      return res.status(400).json({
        message: `Course(s) ${overlapping.join(", ")} already assigned to another teacher`,
      });
    }

    // Assign teacher
    school.teachers.push({
      teacher: teacherId,
      courseIds: pendingRequest.courseIds || [],
    });

    // Notify teacher about approval
    await Notification.create({
      userId: teacherId,
      type: "teacher-request-status",
      status: "approved",
      schoolId,
      schoolName: school.name,
      message: `Your request to join ${school.name} was approved`,
    });

    io.to(teacherId.toString()).emit("teacher-request-status", {
      status: "approved",
      schoolId,
      schoolName: school.name,
      message: `Your request to join ${school.name} was approved`,
    });

    await school.save();
    return res.json({ message: "Teacher request approved" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};


// ================= SELECT SCHOOL =================
const selectSchool = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can select a school" });
    }

    const { schoolId } = req.body;

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    if (!req.user.schools.includes(schoolId)) {
      req.user.schools.push(schoolId);
    }

    if (!school.students.includes(req.user._id)) {
      school.students.push(req.user._id);
    }

    await req.user.save();
    await school.save();

    res.json({ message: "School selected", school });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL SCHOOLS =================
const getSchool = async (req, res) => {
  try {
    const school = await School.find().populate("courses", "name");
    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 }); // newest first
    console.log("req.user._id:", req.user._id);

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getApprovedSchools = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find schools where this teacher is approved
    const schools = await School.find({
      "teachers.teacher": teacherId,
    }).populate("teachers.courseIds", "name");

    if (!schools.length) {
      return res.json({ approved: false, schools: [] });
    }

    // Map to a clean response format
    const approvedSchools = schools.map((school) => {
      // Find the teacher entry for this school
      const teacherEntry = school.teachers.find(
        (t) => t.teacher && t.teacher.toString() === teacherId.toString()
      );

      return {
        _id: teacherEntry?._id,          // teacher document id in school
        teacherId: teacherId,            // the teacher's user id
        schoolId: school._id,            // school id
        schoolName: school.name,         // school name
        courseIds: teacherEntry?.courseIds, // courses assigned
      };
    });

    res.json({ approved: true, schools: approvedSchools });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
// admin get  their own school
// GET school admin's own school
const getMySchool = async (req, res) => {
  try {
    const school = await School.findOne({ createdBy: req.user.id })

   .populate("students", "name email")
      .populate("courses", "name");


    if (!school) {
      return res.status(404).json({ message: "No school found" });
    }

    res.json([school]); // return as array to match frontend
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= MARK NOTIFICATIONS AS READ =================
const  markNotificationsRead= async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  AddSchool,
  getSchool,
   markNotificationsRead,
  getApprovedSchools,
  getTeacherRequests,
  getNotifications,
  getMySchool,
  selectSchool,
  approveTeacher,
  requestToJoinSchool,
  cancelOwnRequest,
};
