const { saveUploadedFile } = require('./localUpload');
const { processUploadedImage } = require('./imageProcessor');

function inferPreset(subdir) {
  if (subdir === 'carousel') return 'carousel';
  if (subdir === 'categories') return 'category';
  return 'product';
}

/**
 * Optimize upload: WebP variants (thumb/medium/large). Falls back to raw save if processing fails.
 */
async function uploadOptimizedImage(fileOrPath, subdir = 'products', preset) {
  const file =
    typeof fileOrPath === 'string'
      ? {
          path: fileOrPath,
          mimetype: inferMimeFromPath(fileOrPath),
          originalname: fileOrPath,
        }
      : fileOrPath;

  const resolvedPreset = preset || inferPreset(subdir);
  const processed = await processUploadedImage(file, subdir, resolvedPreset);

  if (processed?.url && !processed.error) {
    return processed.url;
  }

  const saved = await saveUploadedFile(file, subdir);
  if (!saved) return '';
  if (saved.error) return saved;
  return saved.url;
}

async function uploadOptimizedImages(filePaths, subdir = 'products', preset) {
  if (!filePaths?.length) return [];
  return Promise.all(filePaths.map((entry) => uploadOptimizedImage(entry, subdir, preset)));
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
