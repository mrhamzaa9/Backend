const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {

    // 🎥 LECTURE VIDEO
    if (file.mimetype.startsWith("video")) {
      return {
        folder: "lectures/videos",
        resource_type: "video",
        allowed_formats: ["mp4", "mov", "avi", "mkv"],
      };
    }

    // 📄 ASSIGNMENT PDF
    if (file.mimetype === "application/pdf") {
      return {
        folder: "assignments/pdfs",
        resource_type: "raw",
        allowed_formats: ["pdf"],
  
      };
    }

    throw new Error("Only lecture videos or assignment PDFs are allowed");
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // ✅ supports videos
  },
});

module.exports = upload;
