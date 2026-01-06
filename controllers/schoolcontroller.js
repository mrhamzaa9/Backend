const Notification = require("../models/notification");
const Course = require("../models/course");
const School = require("../models/school");

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

  const user = req.user;
    user.schools.push(school._id);  // push school ID
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

    if (!schoolId || !courseIds || courseIds.length === 0) {
      return res.status(400).json({ message: "School and course required" });
    }

    const school = await School.findById(schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    // ❌ Already teacher in this school
    const isAlreadyTeacher = school.teachers.some(
      (t) => String(t.teacher) === String(req.user._id)
    );
    if (isAlreadyTeacher) {
      return res.status(400).json({ message: "Already a teacher in this school" });
    }

    // 🔒 BLOCK if course already has teacher
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({ message: "teacher avaible of this course" });
      }

      if (course.teachers.length > 0) {
        return res.status(400).json({
          message: `Course "${course.name}" already has a teacher assigned`,
        });
      }
    }

    // ❌ Duplicate pending request
    const alreadyPending = school.pendingTeachers.some(
      (p) => String(p.teacher) === String(req.user._id)
    );
    if (alreadyPending) {
      return res.status(400).json({ message: "Request already sent" });
    }
        // 🔥 SOCKET NOTIFY ADMIN
    const io = getIO();

    io.to(String(school.createdBy)).emit("teacher-request", {
      type: "teacher-request",
      schoolId: school._id,
      schoolName: school.name,
      teacherId: req.user._id,
      message: `New teacher request received from ${req.user.name}`,
    });

    // optional: save notification in DB
    await Notification.create({
      userId: school.createdBy,
      type: "teacher-request",
      schoolId: school._id,
      schoolName: school.name,
      message: `New teacher request received from ${req.user.name}`,
    });
    // ✅ Save request
    school.pendingTeachers.push({
      teacher: req.user._id,
      courseIds,
    });

    await school.save();

    res.json({ message: "Join request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }}


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
    const { schoolId, requestId, approve } = req.body;

    if (!schoolId || !requestId) {
      return res.status(400).json({
        message: "schoolId and requestId are required",
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // ✅ find pending request by requestId
    const index = school.pendingTeachers.findIndex(
      (p) => String(p._id) === String(requestId)
    );

    if (index === -1) {
      return res.status(400).json({ message: "Pending request not found" });
    }

    const pendingRequest = school.pendingTeachers[index];
    const teacherId = pendingRequest.teacher;

    const io = getIO();

    // ❌ REJECT
    if (approve === false) {
      await Notification.create({
        userId: teacherId,
        type: "teacher-request-status",
        status: "rejected",
        schoolId,
        schoolName: school.name,
        message: `Your request to join ${school.name} was rejected`,
      });

      io.to(String(teacherId)).emit("teacher-request-status", {
        status: "rejected",
        schoolId,
        schoolName: school.name,
        message: `Your request to join ${school.name} was rejected`,
      });

      // ✅ remove pending request
      school.pendingTeachers.splice(index, 1);
      await school.save();

      return res.json({ message: "Teacher request rejected" });
    }

    // ✅ APPROVE

    // assign courses to course.teachers
    for (const courseId of pendingRequest.courseIds || []) {
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { teachers: teacherId },
      });
    }

    // prevent course overlap
    const assignedCourses = school.teachers.flatMap((t) =>
      (t.courseIds || []).map((c) => String(c))
    );

    const requestedCourses = (pendingRequest.courseIds || []).map((c) =>
      String(c)
    );

    const overlapping = requestedCourses.filter((c) =>
      assignedCourses.includes(c)
    );

    if (overlapping.length > 0) {
      return res.status(400).json({
        message: "One or more courses already assigned",
      });
    }

    // assign teacher to school
    school.teachers.push({
      teacher: teacherId,
      courseIds: pendingRequest.courseIds || [],
    });

    await Notification.create({
      userId: teacherId,
      type: "teacher-request-status",
      status: "approved",
      schoolId,
      schoolName: school.name,
      message: `Your request to join ${school.name} was approved`,
    });

    io.to(String(teacherId)).emit("teacher-request-status", {
      status: "approved",
      schoolId,
      schoolName: school.name,
      message: `Your request to join ${school.name} was approved`,
    });

    // ✅ remove pending request
    school.pendingTeachers.splice(index, 1);

    await school.save();
    return res.json({ message: "Teacher request approved" });
  } catch (err) {
    console.error(err);
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
//=======================notifcation===========
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
//====================approved=================
const getApprovedSchools = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const schools = await School.find({
      $or: [
        { "pendingTeachers.teacher": teacherId },
        { "teachers.teacher": teacherId },
      ],
    })
      .populate("teachers.courseIds", "name")
      .populate("pendingTeachers.courseIds", "name");

    const response = [];

    schools.forEach((school) => {
      // 🔹 Approved courses
      school.teachers.forEach((t) => {
        if (t.teacher.toString() === teacherId.toString()) {
          response.push({
            _id: t._id,                     // teacher-school relation id
            teacherId: teacherId,
            schoolId: school._id,
            schoolName: school.name,
            courseIds: t.courseIds.map((c) => ({
              _id: c._id,
              name: c.name,
            })),
          });
        }
      });
    });

    return res.json({
      approved: response.length > 0,
      schools: response,
    });
  } catch (err) {
    console.error(err);
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
