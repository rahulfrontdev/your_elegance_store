const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const SAVED_UPLOAD = Symbol('savedUpload');
const DEFAULT_PUBLIC_ORIGIN = 'https://yourelegancestore.com';

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/x-png': '.png',
  'image/webp': '.webp',
};

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const resolveMime = (file) => {
  if (file?.mimetype && MIME_TO_EXT[file.mimetype]) return file.mimetype;
  const ext = path.extname(file?.originalname || '').toLowerCase();
  return EXT_TO_MIME[ext] || file?.mimetype || '';
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getPublicBaseUrl = () =>
  String(process.env.API_PUBLIC_URL || DEFAULT_PUBLIC_ORIGIN).replace(/\/+$/, '');

const buildFilename = (originalName, mimetype) => {
  const fromName = path.extname(originalName || '').toLowerCase();
  const ext = fromName || MIME_TO_EXT[mimetype] || '.jpg';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
};

const toPublicUrl = (relativePath) => `${getPublicBaseUrl()}${relativePath}`;

const buildSavedResult = (relativePath) => ({
  url: relativePath,
  relativePath,
  publicUrl: toPublicUrl(relativePath),
});

const writeUploadBuffer = async (file, destPath) => {
  if (Buffer.isBuffer(file.buffer) && file.buffer.length > 0) {
    await fs.promises.writeFile(destPath, file.buffer);
    return;
  }

  if (!file.path) {
    throw new Error('No upload data received. Please try again.');
  }

  const sourcePath = path.resolve(file.path);
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Upload temp file is missing. Please try uploading again.');
  }

  try {
    await fs.promises.rename(sourcePath, destPath);
  } catch {
    await fs.promises.copyFile(sourcePath, destPath);
    await fs.promises.unlink(sourcePath).catch(() => {});
  }
};

/**
 * Save a Multer file to server/uploads/{subdir} and return a public URL.
 */
async function saveUploadedFile(file, subdir = 'misc') {
  if (!file) return null;

  if (file[SAVED_UPLOAD]) {
    return file[SAVED_UPLOAD];
  }

  const mimetype = resolveMime(file);
  if (!MIME_TO_EXT[mimetype]) {
    return { error: 'Image must be jpeg, jpg, png, or webp' };
  }

  const destDir = path.join(UPLOAD_ROOT, subdir);
  ensureDir(destDir);

  const filename = buildFilename(file.originalname, mimetype);
  const destPath = path.join(destDir, filename);

  try {
    await writeUploadBuffer(file, destPath);
  } catch (err) {
    return { error: err.message || 'Failed to save upload' };
  }

  const result = buildSavedResult(`/uploads/${subdir}/${filename}`);
  file[SAVED_UPLOAD] = result;
  return result;
}

module.exports = {
  UPLOAD_ROOT,
  saveUploadedFile,
  toPublicUrl,
};
