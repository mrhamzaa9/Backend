const express = require("express");
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
      return res
        .status(403)
        .json({ message: "Only teachers can send join requests" });
    }

    const { schoolId, courseIds } = req.body;

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    if (school.teachers.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "Already a teacher in this school" });
    }

    const alreadyRequested = school.pendingTeachers.some(
      (p) => p.teacher.toString() === req.user._id.toString()
    );
    if (alreadyRequested) {
      return res
        .status(400)
        .json({ message: "Join request already submitted" });
    }

    school.pendingTeachers.push({
      teacher: req.user._id,
      courseIds: courseIds || [],
    });

    await school.save();
    res.status(200).json({ message: "Join request sent" });
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

    if (index === -1) {
      return res.status(400).json({ message: "Pending request not found" });
    }

    // remove pending
    school.pendingTeachers.splice(index, 1);

    const io = getIO();
 console.log("Emitting to room:", teacherId);
    // ❌ REJECT
    if (approve === false) {
      await school.save();

      io.to(teacherId.toString()).emit("teacher-request-status", {
        status: "rejected",
        schoolId,
        schoolName: school.name,
        message: `Your request to join ${school.name} was rejected`,
      });
      console.log("Emitting to room:", teacherId.toString());
     

      return res.json({ message: "Teacher request rejected" });
    }

    // ✅ APPROVE
    if (!school.teachers.includes(teacherId)) {
      school.teachers.push(teacherId);
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    if (!teacher.schools.includes(schoolId)) {
      teacher.schools.push(schoolId);
    }

    await Promise.all([school.save(), teacher.save()]);

    // 🔔 SEND SOCKET NOTIFICATION
    io.to(teacherId.toString()).emit("teacher-request-status", {
      status: "approved",
      schoolId,
      schoolName: school.name,
      message: `You are approved as a teacher in ${school.name}`,
    });

    res.json({ message: "Teacher approved successfully" });

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

module.exports = {
  AddSchool,
  getSchool,
  getTeacherRequests,
  selectSchool,
  approveTeacher,
  requestToJoinSchool,
  cancelOwnRequest,
};
