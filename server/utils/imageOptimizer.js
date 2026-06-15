const cloudinary = require('./cloudinary');

const CLOUDINARY_UPLOAD_OPTIONS = {
  quality: 'auto:good',
  fetch_format: 'auto',
  transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
};

/**
 * Upload a file to Cloudinary with automatic compression and format optimization.
 * Returns the secure_url of the optimized image.
 */
async function uploadOptimizedImage(filePath) {
  const uploaded = await cloudinary.uploader.upload(filePath, CLOUDINARY_UPLOAD_OPTIONS);
  return uploaded.secure_url;
}

/**
 * Upload multiple files in parallel with optimization.
 */
async function uploadOptimizedImages(filePaths) {
  if (!filePaths?.length) return [];
  return Promise.all(filePaths.map((path) => uploadOptimizedImage(path)));
}

module.exports = {
  uploadOptimizedImage,
  uploadOptimizedImages,
  CLOUDINARY_UPLOAD_OPTIONS,
};
