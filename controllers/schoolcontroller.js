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
            pendingTeachers: []
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
module.exports = { AddSchool }