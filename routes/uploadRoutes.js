const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// 🛑 DEBUG CHECK: Are keys loaded?
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  console.error("❌ CLOUDINARY ERROR: Keys are missing from .env file!");
} else {
  console.log("✅ Cloudinary Configured for Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
}

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Storage Engine (Updated for Videos)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine if it's a video or image based on mimetype
    const isVideo = file.mimetype.startsWith('video');
    
    return {
      folder: 'napster-imports',
      // 'resource_type' must be 'video' for video files, otherwise 'image'
      resource_type: isVideo ? 'video' : 'image', 
      format: file.mimetype.split('/')[1], // jpg, png, mp4 etc.
      public_id: file.originalname.split('.')[0], // Use original filename
    };
  },
});

const upload = multer({ storage });

// 3. The Upload Route
router.post('/', (req, res) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("❌ UPLOAD FAILED:", err); // Prints the real error to your terminal
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
    
    if (!req.file) {
      console.error("❌ NO FILE RECEIVED");
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log("✅ Upload Success:", req.file.path);
    res.send(req.file.path);
  });
});

module.exports = router;