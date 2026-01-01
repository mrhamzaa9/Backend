const School = require("../models/school");
const User = require("../models/user");

const GetSchool = async (req, res) => {
    try {
        const school = await School.find()
            .populate("createdBy", "name email role")
            .populate("teachers", "name email")
            .populate("students", "name email")
            .populate("courses", "name");
        res.status(200).json(school, totalschool = school.length);

    }
    catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const DeleteSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const DeleteSchool = await School.findByIdAndDelete(id);

        if (!DeleteSchool) {
            return res.status(404).json({ message: "School not found" });
        }

        return res.status(200).json({ message: "School removed successfully", DeleteSchool });
    } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const totalUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users, totalschool = users.length);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const DeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteUser = await User.findByIdAndDelete(id);
        if (!deleteUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User removed successfully", deleteUser });
    } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
const chartdata = async (req, res) => {
    const studentperschool = await User.aggregate([
        { $match: { role: "student" } },
        { $unwind: "$schools" },
        {
            $group: { _id: "$schools", studentCount: { $sum: 1 } }
        },
        {
            $lookup: {
                from: "schools",
                localField: "_id",
                foreignField: "_id",
                as: "school"
            }
        },
        { $unwind: "$school" },
        { $project: { schoolName: "$school.name", studentCount: 1 } }
    ]);

    const teacherperschool = await User.aggregate([
        { $match: { role: "teacher" } },
        { $unwind: "$schools" },
        {
            $group: { _id: "$schools", teacherCount: { $sum: 1 } }
        },
        {
            $lookup: {
                from: "schools",
                localField: "_id",
                foreignField: "_id",
                as: "school"
            }
        },
        { $unwind: "$school" },
        { $project: { schoolName: "$school.name", teacherCount: 1 } }
    ]);

    const courseperschool = await School.aggregate([
        {
            $project: {
                name: 1,
                courseCount: { $size: "$courses" }
            }
        }
    ]);
    const monthlyRegistrations = await User.aggregate([
        { $match: { role: 'student' } },
        {
            $group: {
                _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: { month: '$_id.month', year: '$_id.year', count: 1, _id: 0 } }
    ]);
    
    res.status(200).json({ studentperschool, teacherperschool, courseperschool, monthlyRegistrations });
 

};

module.exports = { GetSchool, DeleteSchool, totalUsers, DeleteUser, chartdata }