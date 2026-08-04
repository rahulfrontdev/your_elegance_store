const multer = require('multer');

/** Memory storage — write once to server/uploads in saveUploadedFile (no /tmp ENOENT). */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 60,
  },
});

module.exports = upload;
