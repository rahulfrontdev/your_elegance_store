const asyncHandler = require('../utils/asyncHandler');
const SpecialDiscountCategory = require('../models/SpecialDiscountCategory');
const User = require('../models/User');
const {
  ensureDefaultSpecialDiscountCategory,
  DEFAULT_CATEGORY_NAME,
} = require('../services/specialDiscountService');
const { invalidateListingDiscountCache } = require('../services/pricingEngine');

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));

exports.listCategories = asyncHandler(async (req, res) => {
  await ensureDefaultSpecialDiscountCategory();
  const categories = await SpecialDiscountCategory.find()
    .sort({ isDefault: -1, name: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const discountPercentage = Number(req.body?.discountPercentage);

  if (name.length < 2) {
    res.status(400);
    throw new Error('Category name must be at least 2 characters');
  }
  if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    res.status(400);
    throw new Error('Discount percentage must be between 0 and 100');
  }

  const exists = await SpecialDiscountCategory.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (exists) {
    res.status(409);
    throw new Error('A category with this name already exists');
  }

  const category = await SpecialDiscountCategory.create({
    name,
    discountPercentage,
    isDefault: false,
    isActive: true,
  });

  invalidateListingDiscountCache();

  return res.status(201).json({
    success: true,
    message: 'Special discount category created',
    data: category,
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid category id');
  }

  const category = await SpecialDiscountCategory.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2) {
      res.status(400);
      throw new Error('Category name must be at least 2 characters');
    }
    const duplicate = await SpecialDiscountCategory.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${name}$`, 'i'),
    });
    if (duplicate) {
      res.status(409);
      throw new Error('A category with this name already exists');
    }
    category.name = name;
  }

  if (req.body?.discountPercentage !== undefined) {
    const discountPercentage = Number(req.body.discountPercentage);
    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      res.status(400);
      throw new Error('Discount percentage must be between 0 and 100');
    }
    category.discountPercentage = discountPercentage;
  }

  if (req.body?.isActive !== undefined) {
    if (category.isDefault && req.body.isActive === false) {
      res.status(400);
      throw new Error('The default Customer category cannot be disabled');
    }
    category.isActive = Boolean(req.body.isActive);
  }

  await category.save();

  invalidateListingDiscountCache();

  return res.status(200).json({
    success: true,
    message: 'Category updated',
    data: category,
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid category id');
  }

  const category = await SpecialDiscountCategory.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  if (category.isDefault) {
    res.status(400);
    throw new Error(`The default "${DEFAULT_CATEGORY_NAME}" category cannot be deleted`);
  }

  const defaultCategory = await ensureDefaultSpecialDiscountCategory();
  await User.updateMany(
    { specialDiscountCategory: category._id },
    { $set: { specialDiscountCategory: defaultCategory._id } }
  );

  await category.deleteOne();

  invalidateListingDiscountCache();

  return res.status(200).json({
    success: true,
    message: 'Category deleted. Assigned customers moved to default category.',
  });
});
