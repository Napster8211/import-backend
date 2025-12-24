const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Files go to 'uploads' folder
  },
  filename(req, file, cb) {
    // Naming convention: fieldname-date.extension (e.g., image-123456789.jpg)
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File Type Validator (Images & Videos)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|mp4|mov|avi/; // Added Video Formats
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images or Videos only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// The Route: POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  res.send(`/${req.file.path.replace(/\\/g, '/')}`); // Returns the path (e.g., /uploads/image-123.jpg)
});

module.exports = router;