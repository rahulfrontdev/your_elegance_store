const { saveUploadedFile } = require('./localUpload');

/**
 * Save an uploaded image to the server disk (products folder).
 * Accepts a Multer file object or legacy file path string.
 */
async function uploadOptimizedImage(fileOrPath, subdir = 'products') {
  const file =
    typeof fileOrPath === 'string'
      ? {
          path: fileOrPath,
          mimetype: inferMimeFromPath(fileOrPath),
          originalname: fileOrPath,
        }
      : fileOrPath;

  const saved = await saveUploadedFile(file, subdir);
  if (!saved) return '';
  if (saved.error) return saved;
  return saved.url;
}

async function uploadOptimizedImages(filePaths, subdir = 'products') {
  if (!filePaths?.length) return [];
  return Promise.all(filePaths.map((entry) => uploadOptimizedImage(entry, subdir)));
}

function inferMimeFromPath(filePath) {
  const ext = String(filePath).toLowerCase().split('.').pop();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

module.exports = {
  uploadOptimizedImage,
  uploadOptimizedImages,
};
