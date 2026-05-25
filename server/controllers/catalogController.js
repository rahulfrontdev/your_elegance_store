const asyncHandler = require('../utils/asyncHandler');
const Catalog = require('../models/Catalog');
const slugify = require('slugify');

exports.createCatalog = asyncHandler(async (req, res) => {
  const { name, description, categoryIds } = req.body;
  const slug = slugify(String(name), { lower: true, strict: true });
  const doc = await Catalog.create({
    name: String(name).trim(),
    slug,
    description: String(description || '').trim(),
    categoryIds: categoryIds || [],
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: doc });
});

exports.listCatalogs = asyncHandler(async (req, res) => {
  const docs = await Catalog.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: docs.length, data: docs });
});

exports.getCatalog = asyncHandler(async (req, res) => {
  const doc = await Catalog.findById(req.params.id).lean();
  if (!doc) {
    res.status(404);
    throw new Error('Catalog not found');
  }
  res.json({ success: true, data: doc });
});

exports.updateCatalog = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) {
    updates.name = String(req.body.name).trim();
    updates.slug = slugify(updates.name, { lower: true, strict: true });
  }
  if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
  if (req.body.categoryIds !== undefined) updates.categoryIds = req.body.categoryIds;
  if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

  const doc = await Catalog.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
  if (!doc) {
    res.status(404);
    throw new Error('Catalog not found');
  }
  res.json({ success: true, data: doc });
});

exports.deleteCatalog = asyncHandler(async (req, res) => {
  const doc = await Catalog.findByIdAndDelete(req.params.id);
  if (!doc) {
    res.status(404);
    throw new Error('Catalog not found');
  }
  res.json({ success: true, message: 'Catalog deleted' });
});
