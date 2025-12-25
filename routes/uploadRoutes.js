// backend/routes/uploadRoutes.js
const path = require('path');
const express = require('express');
const multer = require('multer');

const router = express.Router();

// 1. Configure where to save the files
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in the 'uploads' folder
  },
  filename(req, file, cb) {
    // We name the file: fieldname-date.extension (e.g., image-20251225.jpg)
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// 2. Filter checks (Allow Images & Videos)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|mp4|mov|avi|mkv/; // 🟢 Added Video Formats
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images and Videos Only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// 3. The actual route
// We use 'image' as the key because your frontend sends formData.append('image', file)
router.post('/', upload.single('image'), (req, res) => {
  res.send(`/${req.file.path.replace(/\\/g, '/')}`); // Returns the path to the frontend
});

module.exports = router;