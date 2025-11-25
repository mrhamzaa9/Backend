const School = require("../models/school");

const GetSchool = async (req, res) => {
    try {
        const school = await School.find()
        res.status(200).json(school)
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
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User removed successfully", DeleteSchool });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports={GetSchool,AddSchool,DeleteSchool}