const School = require("../models/school");
const AddSchool = async (req, res) => {
    try {
        console.log("req.user", req.user);
        const { name, address } = req.body
        if (!name || !address) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Check existing user
        const existingSchool = await School.findOne({ createdBy: req.user._id });
        if (existingSchool) {
            return res
                .status(400)
                .json({ error: "You already have a registered school with this account" });
        }

        const school = new School({
            name,
            address,
            createdBy: req.user._id,
            teachers: [],
            students: [],
            pendingTeachers: [],
            courses: []
        })

        req.user.schools.push(school._id)
        await school.save();
        return res.status(201).json({
            message: "School registered successfully",
            school,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
// teacher join school
const requestToJoinSchool = async (req, res) => {
    try {
        if (req.user.role !== 'teacher')
            return res.status(403).json({ message: 'Only teachers can send join requests' });

        const { schoolId } = req.body;

        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // Prevent duplicates
        if (school.teachers.includes(req.user._id))
            return res.json({ message: 'Already a teacher in this school' });

        if (school.pendingTeachers.includes(req.user._id))
            return res.json({ message: 'Join request already submitted' });

        school.pendingTeachers.push(req.user._id);
        await school.save();

        res.json({ message: 'Join request sent' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const approveTeacher = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.body;

        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // Remove from pending
        school.pendingTeachers = school.pendingTeachers.filter(
            id => String(id) !== String(teacherId)
        );

        // Add to teachers
        if (!school.teachers.includes(teacherId))
            school.teachers.push(teacherId);

        // Update teacher model
        const teacher = await User.findById(teacherId);
        if (!teacher) return res.status(400).json({ message: 'Teacher not found' });

        if (!teacher.schools.includes(schoolId))
            teacher.schools.push(schoolId);

        await teacher.save();
        await school.save();

        res.json({ message: 'Teacher approved', school });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

const selectSchool = async (req, res) => {
    try {
        if (req.user.role !== 'student')
            return res.status(403).json({ message: 'Only students can select a school' });

        const { schoolId } = req.body;

        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // Add to student’s list
        if (!req.user.schools.includes(schoolId))
            req.user.schools.push(schoolId);

        // Add to school’s list
        if (!school.students.includes(req.user._id))
            school.students.push(req.user._id);

        await req.user.save();
        await school.save();

        res.json({ message: 'School selected', school });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// view all school for student and teacher
 const getSchool = async (req, res) => {
     try {
         const school = await School.find()
         res.status(200).json(school)
     }
     catch (error) {
         return res.status(500).json({ error: "Internal Server Error" });
     }
 }
module.exports = { AddSchool ,getSchool, selectSchool,approveTeacher,requestToJoinSchool}