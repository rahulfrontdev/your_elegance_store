const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

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
  String(process.env.API_PUBLIC_URL || 'http://98.81.77.254').replace(/\/+$/, '');

const buildFilename = (originalName, mimetype) => {
  const fromName = path.extname(originalName || '').toLowerCase();
  const ext = fromName || MIME_TO_EXT[mimetype] || '.jpg';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
};

const toPublicUrl = (relativePath) => `${getPublicBaseUrl()}${relativePath}`;

/**
 * Save a Multer file to server/uploads/{subdir} and return a public URL.
 */
async function saveUploadedFile(file, subdir = 'misc') {
  if (!file?.path) return null;

  const mimetype = resolveMime(file);
  if (!MIME_TO_EXT[mimetype]) {
    return { error: 'Image must be jpeg, jpg, png, or webp' };
  }

  const destDir = path.join(UPLOAD_ROOT, subdir);
  ensureDir(destDir);

  const filename = buildFilename(file.originalname, mimetype);
  const destPath = path.join(destDir, filename);

  try {
    await fs.promises.rename(file.path, destPath);
  } catch {
    await fs.promises.copyFile(file.path, destPath);
    await fs.promises.unlink(file.path).catch(() => {});
  }

  // Store relative paths so the client can resolve them via VITE_MEDIA_ORIGIN / API origin.
  // Absolute public URL is still available for callers that need it.
  const relativePath = `/uploads/${subdir}/${filename}`;
  return {
    url: relativePath,
    relativePath,
    publicUrl: toPublicUrl(relativePath),
  };
}

module.exports = {
  UPLOAD_ROOT,
  saveUploadedFile,
  toPublicUrl,
};
