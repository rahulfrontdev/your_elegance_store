const mongoose = require('mongoose');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadOptimizedImage } = require('../utils/imageOptimizer');
const { enrichProductsWithCampaignPricing } = require('../services/pricingEngine');
const {
  sanitizeProductReviewsForPublic,
  sanitizeProductsReviewsForPublic,
} = require('../utils/reviewUtils');

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
const allowedImageMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
];
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const validateImageMimeType = (file) => {
  if (!file) return true;
  if (file.mimetype && allowedImageMimeTypes.includes(file.mimetype)) return true;
  const ext = path.extname(file.originalname || '').toLowerCase();
  return allowedImageExtensions.has(ext);
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

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return NaN;
  return parsed;
};

/** Normalise multer output from `.any()` (array) or `.fields()` (object). */
const groupUploadedFiles = (files) => {
  const empty = { image: [], images: [], variationImages: [] };
  if (!files) return empty;

  if (Array.isArray(files)) {
    return {
      image: files.filter((f) => f.fieldname === 'image').slice(0, 1),
      images: files.filter((f) => f.fieldname === 'images').slice(0, 58),
      variationImages: files.filter((f) => f.fieldname === 'variationImages').slice(0, 50),
    };
  }

  return {
    image: (files.image || []).slice(0, 1),
    images: (files.images || []).slice(0, 58),
    variationImages: (files.variationImages || []).slice(0, 50),
  };
};

/** Split combined `images` uploads: extras first, then variation images (see extraImageCount). */
const splitGalleryFiles = (groupedFiles, extraImageCount, hasVariations = false) => {
  const allImages = groupedFiles?.images || [];
  let parsedExtra;
  if (extraImageCount !== undefined && extraImageCount !== null && extraImageCount !== '') {
    parsedExtra = Number(extraImageCount);
  } else if (hasVariations) {
    parsedExtra = 0;
  } else {
    parsedExtra = allImages.length;
  }
  const extraCount = Number.isNaN(parsedExtra)
    ? hasVariations
      ? 0
      : allImages.length
    : Math.min(Math.max(0, parsedExtra), allImages.length);

  return {
    extraImageFiles: allImages.slice(0, extraCount),
    variationImageFiles: [
      ...allImages.slice(extraCount),
      ...(groupedFiles?.variationImages || []),
    ],
  };
};

const parseVariationsPayload = (raw) => {
  if (raw === undefined || raw === null || raw === '') return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
};

const normalizeVariationEntry = (entry, imageUrl = '') => {
  const priceRaw = entry?.price;
  let price = null;
  if (priceRaw !== undefined && priceRaw !== null && priceRaw !== '') {
    const parsed = Number(priceRaw);
    if (!Number.isNaN(parsed) && parsed >= 0) price = parsed;
  }

  return {
    _id: entry?._id && isValidObjectId(entry._id) ? entry._id : undefined,
    sku: String(entry?.sku || '').trim(),
    name: String(entry?.name || '').trim(),
    description: String(entry?.description || '').trim(),
    colour: String(entry?.colour || '').trim(),
    imageUrl: imageUrl || String(entry?.imageUrl || '').trim(),
    price,
  };
};

const validateVariations = (hasVariations, variations) => {
  if (!hasVariations) return { ok: true, variations: [] };

  if (!Array.isArray(variations) || variations.length === 0) {
    return { ok: false, message: 'At least one variation is required when variations are enabled' };
  }

  for (let i = 0; i < variations.length; i += 1) {
    const v = variations[i];
    if (!v.colour) {
      return { ok: false, message: `Variation ${i + 1}: colour is required` };
    }
  }

  return { ok: true, variations };
};

const resolveVariationImageUrls = async (variationsInput, variationImageFiles = []) => {
  const resolved = [];

  for (let i = 0; i < variationsInput.length; i += 1) {
    const entry = variationsInput[i];
    let imageUrl = String(entry?.imageUrl || '').trim();

    const imageIndex = entry?.imageIndex;
    if (imageIndex !== undefined && imageIndex !== null && imageIndex !== '') {
      const idx = Number(imageIndex);
      const file = variationImageFiles[idx];
      if (file) {
        if (!validateImageMimeType(file)) {
          return { error: `Variation ${i + 1} image must be jpeg, jpg, png, or webp` };
        }
        const saved = await uploadOptimizedImage(file);
        if (saved?.error) {
          return { error: saved.error };
        }
        imageUrl = saved;
      }
    }

    resolved.push(normalizeVariationEntry(entry, imageUrl));
  }

  return { variations: resolved };
};

const uploadProductImages = async (rawFiles, extraImageCount = 0, hasVariations = false) => {
  const files = groupUploadedFiles(rawFiles);
  const { extraImageFiles } = splitGalleryFiles(files, extraImageCount, hasVariations);
  const mainImageFile = files.image[0];

  if (mainImageFile && !validateImageMimeType(mainImageFile)) {
    return { error: 'Main image must be jpeg, jpg, png, or webp' };
  }
  if (extraImageFiles.some((file) => !validateImageMimeType(file))) {
    return { error: 'All extra images must be jpeg, jpg, png, or webp' };
  }

  let mainImageUrl;
  if (mainImageFile) {
    const saved = await uploadOptimizedImage(mainImageFile);
    if (saved?.error) return { error: saved.error };
    mainImageUrl = saved;
  }

  let extraImageUrls = [];
  if (extraImageFiles.length > 0) {
    const uploadedExtras = await Promise.all(
      extraImageFiles.map((file) => uploadOptimizedImage(file))
    );
    const badExtra = uploadedExtras.find((item) => item?.error);
    if (badExtra) return { error: badExtra.error };
    extraImageUrls = uploadedExtras.filter(Boolean);
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
      sku,
      hasVariations,
      variations: variationsRaw,
      extraImageCount,
    } = req.body;
    const normalizedSubcategory = normalizeOptionalObjectId(subcategory);
    const hasVariationsFlag =
      hasVariations === true ||
      hasVariations === 'true' ||
      hasVariations === 1 ||
      hasVariations === '1';

    const parsedVariationsRaw = parseVariationsPayload(variationsRaw);
    if (parsedVariationsRaw === null) {
      return res.status(400).json({ message: 'Invalid variations JSON' });
    }

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

    const groupedFiles = groupUploadedFiles(req.files);
    const { variationImageFiles } = splitGalleryFiles(
      groupedFiles,
      extraImageCount,
      hasVariationsFlag
    );
    const uploadedImages = await uploadProductImages(
      groupedFiles,
      extraImageCount,
      hasVariationsFlag
    );
    if (uploadedImages.error) {
      return res.status(400).json({ message: uploadedImages.error });
    }

    const resolvedVariations = await resolveVariationImageUrls(
      hasVariationsFlag ? parsedVariationsRaw : [],
      variationImageFiles
    );
    if (resolvedVariations.error) {
      return res.status(400).json({ message: resolvedVariations.error });
    }

    const variationCheck = validateVariations(hasVariationsFlag, resolvedVariations.variations);
    if (!variationCheck.ok) {
      return res.status(400).json({ message: variationCheck.message });
    }

    const product = await Product.create({
      sku: String(sku || '').trim(),
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
      hasVariations: hasVariationsFlag,
      variations: variationCheck.variations,
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
    return res.json(sanitizeProductsReviewsForPublic(productsWithDiscounts));
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
      data: sanitizeProductsReviewsForPublic(productsWithDiscounts),
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
      data: sanitizeProductsReviewsForPublic(productsWithDiscounts),
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
      data: sanitizeProductsReviewsForPublic(bestDeals),
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
    return res.json(sanitizeProductReviewsForPublic(productWithDiscount));
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
      sku,
      hasVariations,
      variations: variationsRaw,
      extraImageCount,
    } = req.body;
    const normalizedSubcategory = normalizeOptionalObjectId(subcategory);
    const groupedFiles = groupUploadedFiles(req.files);

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (colour !== undefined) updates.colour = colour;
    if (sku !== undefined) updates.sku = String(sku || '').trim();
    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = normalizedSubcategory;

    if (hasVariations !== undefined) {
      updates.hasVariations =
        hasVariations === true ||
        hasVariations === 'true' ||
        hasVariations === 1 ||
        hasVariations === '1';
    }

    const nextHasVariations =
      updates.hasVariations !== undefined ? updates.hasVariations : product.hasVariations;

    if (variationsRaw !== undefined) {
      const parsedVariationsRaw = parseVariationsPayload(variationsRaw);
      if (parsedVariationsRaw === null) {
        return res.status(400).json({ message: 'Invalid variations JSON' });
      }

      const { variationImageFiles } = splitGalleryFiles(
        groupedFiles,
        extraImageCount,
        nextHasVariations
      );

      const uploadedImages = await uploadProductImages(
        groupedFiles,
        extraImageCount,
        nextHasVariations
      );
      if (uploadedImages.error) {
        return res.status(400).json({ message: uploadedImages.error });
      }
      if (uploadedImages.mainImageUrl) {
        updates.imageUrl = uploadedImages.mainImageUrl;
      }
      if (uploadedImages.extraImageUrls.length > 0) {
        updates.images = [...(product.images || []), ...uploadedImages.extraImageUrls];
      }

      const resolvedVariations = await resolveVariationImageUrls(
        parsedVariationsRaw,
        variationImageFiles
      );
      if (resolvedVariations.error) {
        return res.status(400).json({ message: resolvedVariations.error });
      }

      const variationCheck = validateVariations(nextHasVariations, resolvedVariations.variations);
      if (!variationCheck.ok) {
        return res.status(400).json({ message: variationCheck.message });
      }
      updates.variations = variationCheck.variations;
    } else if (updates.hasVariations === false) {
      updates.variations = [];
    }

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

    if (variationsRaw === undefined) {
      const uploadedImages = await uploadProductImages(
        groupedFiles,
        extraImageCount,
        nextHasVariations
      );
      if (uploadedImages.error) {
        return res.status(400).json({ message: uploadedImages.error });
      }
      if (uploadedImages.mainImageUrl) {
        updates.imageUrl = uploadedImages.mainImageUrl;
      }
      if (uploadedImages.extraImageUrls.length > 0) {
        updates.images = [...(product.images || []), ...uploadedImages.extraImageUrls];
      }
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
