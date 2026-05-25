const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../utils/cloudinary');
const { enrichProductsWithCampaignPricing } = require('../services/pricingEngine');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function assertCategoryAndSubcategory(parentId, subId) {
  const normalizedSubId = normalizeOptionalObjectId(subId);

  if (!isValidObjectId(parentId)) {
    return { ok: false, status: 400, message: 'Invalid category id' };
  }

  if (normalizedSubId == null) {
    const parentCat = await Category.findById(parentId);
    if (!parentCat) {
      return { ok: false, status: 400, message: 'Category not found' };
    }
    return { ok: true };
  }

  if (!isValidObjectId(normalizedSubId)) {
    return { ok: false, status: 400, message: 'Invalid subcategory id' };
  }

  const [parentCat, subCat] = await Promise.all([
    Category.findById(parentId),
    Category.findById(normalizedSubId),
  ]);

  if (!parentCat) {
    return { ok: false, status: 400, message: 'Category not found' };
  }
  if (!subCat) {
    return { ok: false, status: 400, message: 'Subcategory not found' };
  }

  if (!subCat.parentId || !subCat.parentId.equals(parentCat._id)) {
    return {
      ok: false,
      status: 400,
      message: 'Subcategory does not belong to the selected category',
    };
  }

  return { ok: true };
}

const productPopulate = [
  { path: 'category', select: 'name slug description' },
  { path: 'subcategory', select: 'name slug description parentId level' },
];

const allowedGstRates = [3, 12, 18];
const allowedImageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return NaN;
  return parsed;
};

const normalizeOptionalObjectId = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }

  return value.trim();
};

const normalizeCategoryQueryValues = (rawCategory) => {
  if (!rawCategory) return [];

  const rawValues = Array.isArray(rawCategory) ? rawCategory : [rawCategory];

  return rawValues
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);
};

const validateImageMimeType = (file) =>
  !file || allowedImageMimeTypes.includes(file.mimetype);

const uploadProductImages = async (files = {}) => {
  const mainImageFile = files?.image?.[0];
  const extraImageFiles = files?.images || [];

  if (!validateImageMimeType(mainImageFile)) {
    return { error: 'Main image must be jpeg, jpg, png, or webp' };
  }
  if (extraImageFiles.some((file) => !validateImageMimeType(file))) {
    return { error: 'All extra images must be jpeg, jpg, png, or webp' };
  }

  let mainImageUrl;
  if (mainImageFile) {
    const uploaded = await cloudinary.uploader.upload(mainImageFile.path);
    mainImageUrl = uploaded.secure_url;
  }

  let extraImageUrls = [];
  if (extraImageFiles.length > 0) {
    const uploadedExtras = await Promise.all(
      extraImageFiles.map((file) => cloudinary.uploader.upload(file.path))
    );
    extraImageUrls = uploadedExtras.map((item) => item.secure_url);
  }

  return { mainImageUrl, extraImageUrls };
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      colour,
      price,
      qty,
      gstRate,
      category,
      subcategory,
      imageUrl,
    } = req.body;
    const normalizedSubcategory = normalizeOptionalObjectId(subcategory);

    if (!name || price == null || !category) {
      return res.status(400).json({
        message: 'Name, price, and category are required',
      });
    }

    const parsedPrice = parseNumber(price);
    const parsedQty = parseNumber(qty);
    const parsedGst = parseNumber(gstRate);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    if (Number.isNaN(parsedQty) || (parsedQty !== undefined && parsedQty < 0)) {
      return res.status(400).json({ message: 'Invalid qty' });
    }
    if (!allowedGstRates.includes(parsedGst)) {
      return res.status(400).json({ message: 'GST rate must be one of 3, 12, 18' });
    }

    const check = await assertCategoryAndSubcategory(category, normalizedSubcategory);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }

    const uploadedImages = await uploadProductImages(req.files);
    if (uploadedImages.error) {
      return res.status(400).json({ message: uploadedImages.error });
    }

    const product = await Product.create({
      name,
      description,
      colour,
      price: parsedPrice,
      qty: parsedQty ?? 0,
      gstRate: parsedGst,
      category,
      subcategory: normalizedSubcategory,
      imageUrl: uploadedImages.mainImageUrl || imageUrl || '',
      images: uploadedImages.extraImageUrls,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await product.populate(productPopulate);
    return res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const categoryValues = normalizeCategoryQueryValues(req.query.category);
    const filter = {};

    if (categoryValues.length > 0) {
      const escapedValues = categoryValues.map((value) => escapeRegex(value));
      const categoryMatchConditions = [
        { name: { $in: escapedValues.map((value) => new RegExp(`^${value}$`, 'i')) } },
        { slug: { $in: categoryValues.map((value) => value.toLowerCase()) } },
      ];

      const matchedCategories = await Category.find({ $or: categoryMatchConditions })
        .select('_id path')
        .lean();

      if (matchedCategories.length === 0) {
        return res.json([]);
      }

      const descendantCategories = await Category.find({
        $or: matchedCategories.flatMap((cat) => [
          { _id: cat._id },
          { path: { $regex: `^${escapeRegex(cat.path)},` } },
        ]),
      })
        .select('_id')
        .lean();

      const categoryIds = descendantCategories.map((cat) => cat._id);

      filter.$or = [{ category: { $in: categoryIds } }, { subcategory: { $in: categoryIds } }];
    }

    const products = await Product.find(filter)
      .populate(productPopulate)
      .sort('-createdAt')
      .lean();
    const productsWithDiscounts = await enrichProductsWithCampaignPricing(products);
    return res.json(productsWithDiscounts);
  } catch (error) {
    console.error('Get products error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/latest?limit=10
const getLatestProducts = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isNaN(requestedLimit)
      ? 10
      : Math.min(Math.max(requestedLimit, 1), 50);

    const products = await Product.find()
      .populate(productPopulate)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const productsWithDiscounts = await enrichProductsWithCampaignPricing(products);

    return res.json({
      data: productsWithDiscounts,
      count: productsWithDiscounts.length,
      limit,
    });
  } catch (error) {
    console.error('Get latest products error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/category/:categoryId
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const selectedCategory = await Category.findById(categoryId).lean();
    if (!selectedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const descendantCategories = await Category.find({
      $or: [
        { _id: selectedCategory._id },
        { path: { $regex: `^${escapeRegex(selectedCategory.path)},` } },
      ],
    })
      .select('_id')
      .lean();

    const categoryIds = descendantCategories.map((cat) => cat._id);

    const products = await Product.find({
      $or: [{ category: { $in: categoryIds } }, { subcategory: { $in: categoryIds } }],
    })
      .populate(productPopulate)
      .sort({ createdAt: -1 })
      .lean();
    const productsWithDiscounts = await enrichProductsWithCampaignPricing(products);

    return res.json({
      data: productsWithDiscounts,
      count: productsWithDiscounts.length,
      categoryId,
    });
  } catch (error) {
    console.error('Get products by category error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/best-deals?limit=20&minDiscountPercent=5
const getBestDealProducts = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isNaN(requestedLimit)
      ? 20
      : Math.min(Math.max(requestedLimit, 1), 50);
    const requestedMinDiscount = Number(req.query.minDiscountPercent);
    const minDiscountPercent = Number.isNaN(requestedMinDiscount)
      ? 0
      : Math.min(Math.max(requestedMinDiscount, 0), 100);

    const products = await Product.find()
      .populate(productPopulate)
      .sort({ createdAt: -1 })
      .lean();
    const productsWithDiscounts = await enrichProductsWithCampaignPricing(products);
    const bestDeals = productsWithDiscounts
      .filter((product) => product.hasActiveDiscount && product.discountPercentage >= minDiscountPercent)
      .sort((a, b) => b.discountPercentage - a.discountPercentage || b.discountAmount - a.discountAmount)
      .slice(0, limit);

    return res.json({
      success: true,
      data: bestDeals,
      count: bestDeals.length,
      limit,
      minDiscountPercent,
    });
  } catch (error) {
    console.error('Get best deal products error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/gst-rates
const getGstRates = async (req, res) => {
  return res.json({ rates: allowedGstRates });
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(productPopulate).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const [productWithDiscount] = await enrichProductsWithCampaignPricing([product]);
    return res.json(productWithDiscount);
  } catch (error) {
    console.error('Get product error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      description,
      colour,
      price,
      qty,
      gstRate,
      category,
      subcategory,
      imageUrl,
    } = req.body;
    const normalizedSubcategory = normalizeOptionalObjectId(subcategory);

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (colour !== undefined) updates.colour = colour;
    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = normalizedSubcategory;

    if (price !== undefined) {
      const parsedPrice = parseNumber(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'Invalid price' });
      }
      updates.price = parsedPrice;
    }
    if (qty !== undefined) {
      const parsedQty = parseNumber(qty);
      if (Number.isNaN(parsedQty) || parsedQty < 0) {
        return res.status(400).json({ message: 'Invalid qty' });
      }
      updates.qty = parsedQty;
    }
    if (gstRate !== undefined) {
      const parsedGst = parseNumber(gstRate);
      if (!allowedGstRates.includes(parsedGst)) {
        return res.status(400).json({ message: 'GST rate must be one of 3, 12, 18' });
      }
      updates.gstRate = parsedGst;
    }
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    const uploadedImages = await uploadProductImages(req.files);
    if (uploadedImages.error) {
      return res.status(400).json({ message: uploadedImages.error });
    }
    if (uploadedImages.mainImageUrl) {
      updates.imageUrl = uploadedImages.mainImageUrl;
    }
    // Append behavior for extra images: keep old extras and add newly uploaded extras.
    if (uploadedImages.extraImageUrls.length > 0) {
      updates.images = [...(product.images || []), ...uploadedImages.extraImageUrls];
    }

    const nextCategory = updates.category ?? product.category;
    const nextSubcategory = updates.subcategory ?? product.subcategory;

    if (updates.category !== undefined || updates.subcategory !== undefined) {
      const check = await assertCategoryAndSubcategory(nextCategory, nextSubcategory);
      if (!check.ok) {
        return res.status(check.status).json({ message: check.message });
      }
    }

    updates.updatedBy = req.user?._id;
    Object.assign(product, updates);
    await product.save();
    await product.populate(productPopulate);

    return res.json(product);
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLatestProducts,
  getProductsByCategory,
  getBestDealProducts,
  getGstRates,
  getProductById,
  updateProduct,
  deleteProduct,
};
