/**
 * Seed home carousel promotional slides from client/public assets.
 * Usage: cd server && node scripts/seedCarouselPromo.js
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const CarouselSlide = require('../models/CarouselSlide');
const { toPublicUrl } = require('../utils/localUpload');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'carousel');
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'client', 'public');

const PROMO_SLIDES = [
  {
    sourceFile: 'pink-handbags.jpg',
    title: 'New Season Handbags Collection',
    linkUrl: '/products',
    sortOrder: 1,
  },
  {
    sourceFile: 'close-up-elegant-bag.jpg',
    title: 'Elegant Bags — Shop Now',
    linkUrl: '/products',
    sortOrder: 2,
  },
  {
    sourceFile: 'your Elegance Store (16).png',
    title: 'Your Elegance Store',
    linkUrl: '/',
    sortOrder: 3,
  },
];

function copyToCarouselUploads(sourcePath, originalName) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);
  fs.copyFileSync(sourcePath, destPath);
  return toPublicUrl(`/uploads/carousel/${filename}`);
}

async function main() {
  await connectDB();

  for (const slide of PROMO_SLIDES) {
    const sourcePath = path.join(PUBLIC_DIR, slide.sourceFile);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Skip "${slide.title}" — missing file: ${slide.sourceFile}`);
      continue;
    }

    const existing = await CarouselSlide.findOne({ title: slide.title });
    if (existing) {
      console.log(`Already exists: ${slide.title}`);
      continue;
    }

    const imageUrl = copyToCarouselUploads(sourcePath, slide.sourceFile);
    await CarouselSlide.create({
      imageUrl,
      title: slide.title,
      linkUrl: slide.linkUrl,
      sortOrder: slide.sortOrder,
      isActive: true,
    });
    console.log(`Created carousel slide: ${slide.title}`);
  }

  // Fix titles on existing slides that have empty title
  const untitled = await CarouselSlide.find({ $or: [{ title: '' }, { title: null }] });
  for (const [i, doc] of untitled.entries()) {
    doc.title = `Promotional banner ${i + 1}`;
    doc.sortOrder = doc.sortOrder || i;
    await doc.save();
    console.log(`Updated title: ${doc.title}`);
  }

  const active = await CarouselSlide.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
  console.log(`\nActive carousel slides: ${active.length}`);
  active.forEach((s) => console.log(`  • [${s.sortOrder}] ${s.title} → ${s.imageUrl}`));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
