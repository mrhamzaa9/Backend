const School = require("../models/school");
const User = require("../models/user");

const GetSchool = async (req, res) => {
    try {
        const school = await School.find()
            .populate("createdBy", "name email role")
            .populate("teachers", "name email")
            .populate("students", "name email")
        res.status(200).json(school)
    }
    catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const DeleteSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const DeleteSchool = await  School.findByIdAndDelete(id);

        if (!DeleteSchool) {
            return res.status(404).json({ message: "School not found" });
        }

        return res.status(200).json({ message: "School removed successfully", DeleteSchool });
    } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
   ;
module.exports = { GetSchool, DeleteSchool}