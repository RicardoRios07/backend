const multer = require('multer');
const path = require('path');
const fs = require('fs');

const FILES_PATH = process.env.FILES_STORAGE_PATH || path.join(__dirname, '../../files');

if (!fs.existsSync(FILES_PATH)) fs.mkdirSync(FILES_PATH, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, FILES_PATH);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

module.exports = upload;
