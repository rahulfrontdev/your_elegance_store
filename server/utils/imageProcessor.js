const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { UPLOAD_ROOT } = require('./localUpload');

const PRESETS = {
  product: [
    { suffix: 'thumb', width: 400, height: 400 },
    { suffix: 'medium', width: 800, height: 800 },
    { suffix: 'large', width: 1600, height: 1600 },
  ],
  carousel: [
    { suffix: 'medium', width: 1200, height: 480 },
    { suffix: 'large', width: 2000, height: 800 },
  ],
  category: [
    { suffix: 'thumb', width: 480, height: 480 },
    { suffix: 'medium', width: 960, height: 960 },
  ],
};

const WEBP_QUALITY = 82;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildBaseName() {
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function getInputBuffer(file) {
  if (Buffer.isBuffer(file?.buffer) && file.buffer.length > 0) {
    return file.buffer;
  }
  if (file?.path && fs.existsSync(file.path)) {
    return fs.readFileSync(file.path);
  }
  return null;
}

function pickPrimaryUrl(variantUrls, preset) {
  if (preset === 'carousel') {
    return variantUrls.large || variantUrls.medium || variantUrls.thumb || '';
  }
  return variantUrls.medium || variantUrls.large || variantUrls.thumb || '';
}

/**
 * Resize + WebP compress upload; writes multiple variants to disk.
 * @returns {{ url: string, variants: Record<string, string>, relativePath: string }}
 */
async function processUploadedImage(file, subdir = 'products', preset = 'product') {
  const buffer = getInputBuffer(file);
  if (!buffer?.length) {
    return { error: 'No upload data received. Please try again.' };
  }

  const variants = PRESETS[preset] || PRESETS.product;
  const destDir = path.join(UPLOAD_ROOT, subdir);
  ensureDir(destDir);

  const base = buildBaseName();
  const variantUrls = {};

  try {
    for (const variant of variants) {
      const filename = `${base}-${variant.suffix}.webp`;
      const destPath = path.join(destDir, filename);

      await sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize(variant.width, variant.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(destPath);

      variantUrls[variant.suffix] = `/uploads/${subdir}/${filename}`;
    }

    const url = pickPrimaryUrl(variantUrls, preset);
    return {
      url,
      relativePath: url,
      variants: variantUrls,
    };
  } catch (err) {
    return { error: err.message || 'Failed to optimize image' };
  }
}

module.exports = {
  PRESETS,
  processUploadedImage,
};
