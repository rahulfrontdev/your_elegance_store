const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');

const UPLOAD_TMP = path.join(os.tmpdir(), 'yourelegance-uploads');

if (!fs.existsSync(UPLOAD_TMP)) {
  fs.mkdirSync(UPLOAD_TMP, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_TMP),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 60,
  },
});

module.exports = upload;
