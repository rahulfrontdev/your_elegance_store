const mongoose = require('mongoose');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const { expandCatalogToCategoryIdSet, getDescendantCategoryIds } = require('./categoryTree');

const baseUnitPrice = (product) => {
  if (!product) return 0;
  return Number(product.price) || 0;
};

const getEntityId = (value) => {
  if (!value) return '';
  if (value._id) return String(value._id);
  return String(value);
};

const pickProductImage = (product = {}) => {
  if (typeof product.imageUrl === 'string' && product.imageUrl.trim()) {
    return product.imageUrl.trim();
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images.find((img) => typeof img === 'string' && img.trim());
    return firstImage ? firstImage.trim() : '';
  }
  return '';
};

const computeRawDiscountOnAmount = (amount, discount) => {
  if (amount <= 0) return 0;
  let raw = 0;
  if (discount.discountType === 'percentage') {
    raw = (amount * Number(discount.discountValue)) / 100;
  } else {
    raw = Math.min(Number(discount.discountValue), amount);
  }
  if (discount.maximumDiscountAmount != null && discount.maximumDiscountAmount > 0) {
    raw = Math.min(raw, Number(discount.maximumDiscountAmount));
  }
  return Number(raw.toFixed(2));
};

const isAutoDiscount = (d) => !String(d.discountCode || '').trim();

async function assertUsageAllowed(discountDoc, userId) {
  if (discountDoc.usageLimit != null && discountDoc.totalRedemptions >= discountDoc.usageLimit) {
    const err = new Error('Discount usage limit reached');
    err.statusCode = 400;
    throw err;
  }
  if (userId && discountDoc.usagePerUser != null) {
    const n = await DiscountUsage.countDocuments({
      discount: discountDoc._id,
      user: userId,
    });
    if (n >= discountDoc.usagePerUser) {
      const err = new Error('Discount usage limit reached for this user');
      err.statusCode = 400;
      throw err;
    }
  }
}

/** Sync match when category expansion is precomputed per discount */
function productMatchesCategoryDiscount(product, expandedCategoryIdSet) {
  const cat = getEntityId(product.category);
  const sub = getEntityId(product.subcategory);
  return expandedCategoryIdSet.has(cat) || (!!sub && expandedCategoryIdSet.has(sub));
}

/**
 * Precompute: discountId -> Set(categoryId strings) for category-type discounts
 */
async function buildCategoryExpansionForDiscount(discount) {
  const set = new Set();
  if (discount.applicableOn !== 'category') return set;
  for (const cid of discount.categoryIds || []) {
    const subset = await getDescendantCategoryIds(cid);
    subset.forEach((id) => set.add(id));
  }
  return set;
}

async function buildCatalogCacheForDiscount(discount) {
  const map = new Map();
  if (discount.applicableOn !== 'catalog') return map;
  for (const catalogId of discount.catalogIds || []) {
    const set = await expandCatalogToCategoryIdSet(catalogId);
    map.set(String(catalogId), set);
  }
  return map;
}

function lineEligibleForDiscount(product, discount, categorySet, catalogCache) {
  if (discount.applicableOn === 'product') {
    const ids = (discount.productIds || []).map((x) => String(x));
    return ids.includes(getEntityId(product._id));
  }
  if (discount.applicableOn === 'category') {
    return productMatchesCategoryDiscount(product, categorySet);
  }
  if (discount.applicableOn === 'catalog') {
    const cat = getEntityId(product.category);
    const sub = getEntityId(product.subcategory);
    for (const set of catalogCache.values()) {
      if (set.has(cat) || (sub && set.has(sub))) return true;
    }
    return false;
  }
  return false;
}

/**
 * Among eligible discounts, pick single winner: highest priority, then largest discount amount on lineSubtotal.
 */
function pickBestLineDiscount(lineSubtotal, eligibleDiscountDocs) {
  if (!eligibleDiscountDocs.length) return null;
  const scored = eligibleDiscountDocs.map((d) => ({
    d,
    amount: computeRawDiscountOnAmount(lineSubtotal, d),
    priority: Number(d.priority) || 0,
  }));
  scored.sort((a, b) => b.priority - a.priority || b.amount - a.amount);
  const best = scored[0];
  if (best.amount <= 0) return null;
  return { discount: best.d, discountAmount: best.amount };
}

/**
 * @param {Object} params
 * @param {string|null} params.userId
 * @param {{ productId: string, quantity: number }[]} params.items
 * @param {string} [params.discountCode] - optional coupon (no stacking with auto line discounts)
 */
async function calculateOrderPricing({ userId, items, discountCode }) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('items are required');
    err.statusCode = 400;
    throw err;
  }

  const productIds = items.map((i) => i.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
  const productsById = new Map(dbProducts.map((p) => [String(p._id), p]));

  const preliminary = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productsById.get(String(item.productId));
    const quantity = Number(item.quantity);
    if (!product) {
      const err = new Error('One or more products not found');
      err.statusCode = 400;
      throw err;
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      const err = new Error('Each item quantity must be at least 1');
      err.statusCode = 400;
      throw err;
    }
    const unit = baseUnitPrice(product);
    const lineSubtotal = Number((unit * quantity).toFixed(2));
    subtotal += lineSubtotal;
    preliminary.push({ product, quantity, unit, lineSubtotal });
  }
  subtotal = Number(subtotal.toFixed(2));

  const code = String(discountCode || '').trim().toUpperCase();

  if (code) {
    const now = new Date();
    const coupon = await Discount.findOne({
      discountCode: code,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    if (!coupon) {
      const err = new Error('Invalid or expired coupon code');
      err.statusCode = 400;
      throw err;
    }

    await assertUsageAllowed(coupon, userId);

    if (coupon.minimumOrderAmount > 0 && subtotal < coupon.minimumOrderAmount) {
      const err = new Error(
        `Minimum order amount of ₹${coupon.minimumOrderAmount} required for this coupon`
      );
      err.statusCode = 400;
      throw err;
    }

    const categorySet = await buildCategoryExpansionForDiscount(coupon);
    const catalogCache = await buildCatalogCacheForDiscount(coupon);

    let eligibleSubtotal = 0;
    const lineFlags = preliminary.map((row) => {
      const ok = lineEligibleForDiscount(row.product, coupon, categorySet, catalogCache);
      if (ok) eligibleSubtotal += row.lineSubtotal;
      return ok;
    });

    if (eligibleSubtotal <= 0) {
      const err = new Error('Coupon is not applicable to items in this cart');
      err.statusCode = 400;
      throw err;
    }

    let orderDiscount = computeRawDiscountOnAmount(eligibleSubtotal, coupon);
    orderDiscount = Number(Math.min(orderDiscount, eligibleSubtotal).toFixed(2));

    const lines = preliminary.map((row, idx) => {
      const share = lineFlags[idx] ? row.lineSubtotal / eligibleSubtotal : 0;
      const discountAmount = Number((orderDiscount * share).toFixed(2));
      const finalLineTotal = Number((row.lineSubtotal - discountAmount).toFixed(2));
      return {
        productId: row.product._id,
        name: row.product.name,
        image: pickProductImage(row.product),
        quantity: row.quantity,
        unitOriginalPrice: row.unit,
        lineSubtotal: row.lineSubtotal,
        discountAmount,
        finalLineTotal,
        appliedDiscountId: lineFlags[idx] ? coupon._id : null,
        appliedDiscountName: lineFlags[idx] ? coupon.discountName : '',
        discountType: lineFlags[idx] ? coupon.discountType : '',
      };
    });

    let allocated = lines.reduce((s, l) => s + l.discountAmount, 0);
    const drift = Number((orderDiscount - allocated).toFixed(2));
    if (drift !== 0) {
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        if (lineFlags[i]) {
          lines[i].discountAmount = Number((lines[i].discountAmount + drift).toFixed(2));
          lines[i].finalLineTotal = Number((lines[i].lineSubtotal - lines[i].discountAmount).toFixed(2));
          break;
        }
      }
    }

    const discountTotal = Number(lines.reduce((s, l) => s + l.discountAmount, 0).toFixed(2));
    const finalTotal = Number((subtotal - discountTotal).toFixed(2));

    return {
      subtotal,
      discountTotal,
      finalTotal,
      couponCode: code,
      stackingMode: 'coupon_only',
      appliedDiscountIds: [coupon._id],
      lines,
    };
  }

  const rawAuto = await Discount.find({
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    $or: [{ discountCode: '' }, { discountCode: null }, { discountCode: { $exists: false } }],
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  const autoDiscounts = [];
  for (const d of rawAuto) {
    if (!isAutoDiscount(d)) continue;
    try {
      await assertUsageAllowed(d, userId);
      autoDiscounts.push(d);
    } catch {
      /* skip exhausted discounts */
    }
  }

  const meetsMinimumOrder = (d, orderSubtotal) => {
    const m = Number(d.minimumOrderAmount) || 0;
    return orderSubtotal >= m;
  };

  const expansionCache = new Map();
  for (const d of autoDiscounts) {
    const key = String(d._id);
    expansionCache.set(key, {
      categorySet: await buildCategoryExpansionForDiscount(d),
      catalogCache: await buildCatalogCacheForDiscount(d),
    });
  }

  const lines = [];
  const appliedIds = new Set();

  for (const row of preliminary) {
    const eligible = [];
    for (const d of autoDiscounts) {
      if (!isAutoDiscount(d)) continue;
      if (!meetsMinimumOrder(d, subtotal)) continue;
      const { categorySet, catalogCache } = expansionCache.get(String(d._id));
      if (lineEligibleForDiscount(row.product, d, categorySet, catalogCache)) {
        eligible.push(d);
      }
    }
    const winner = pickBestLineDiscount(row.lineSubtotal, eligible);
    const discountAmount = winner ? winner.discountAmount : 0;
    const finalLineTotal = Number((row.lineSubtotal - discountAmount).toFixed(2));
    if (winner?.discount?._id) appliedIds.add(String(winner.discount._id));

    lines.push({
      productId: row.product._id,
      name: row.product.name,
      image: pickProductImage(row.product),
      quantity: row.quantity,
      unitOriginalPrice: row.unit,
      lineSubtotal: row.lineSubtotal,
      discountAmount,
      finalLineTotal,
      appliedDiscountId: winner?.discount?._id || null,
      appliedDiscountName: winner?.discount?.discountName || '',
      discountType: winner?.discount?.discountType || '',
    });
  }

  const discountTotal = Number(lines.reduce((s, l) => s + l.discountAmount, 0).toFixed(2));
  const finalTotal = Number((subtotal - discountTotal).toFixed(2));

  return {
    subtotal,
    discountTotal,
    finalTotal,
    couponCode: '',
    stackingMode: 'auto_line_best_priority',
    appliedDiscountIds: Array.from(appliedIds).map((id) => new mongoose.Types.ObjectId(id)),
    lines,
  };
}

async function getEligibleAutoDiscounts(userId = null) {
  const rawAuto = await Discount.find({
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    $or: [{ discountCode: '' }, { discountCode: null }, { discountCode: { $exists: false } }],
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  const autoDiscounts = [];
  for (const d of rawAuto) {
    if (!isAutoDiscount(d)) continue;
    try {
      await assertUsageAllowed(d, userId);
      autoDiscounts.push(d);
    } catch {
      /* skip exhausted discounts for listing previews */
    }
  }

  return autoDiscounts;
}

async function buildExpansionCache(discounts) {
  const expansionCache = new Map();
  for (const d of discounts) {
    const key = String(d._id);
    expansionCache.set(key, {
      categorySet: await buildCategoryExpansionForDiscount(d),
      catalogCache: await buildCatalogCacheForDiscount(d),
    });
  }
  return expansionCache;
}

async function enrichProductsWithCampaignPricing(products = [], { userId = null } = {}) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const autoDiscounts = await getEligibleAutoDiscounts(userId);
  if (autoDiscounts.length === 0) {
    return products.map((product) => {
      const p = typeof product.toObject === 'function' ? product.toObject() : product;
      const originalPrice = baseUnitPrice(p);
      return {
        ...p,
        originalPrice,
        discountAmount: 0,
        discountPercentage: 0,
        discountedPrice: originalPrice,
        hasActiveDiscount: false,
        appliedDiscount: null,
      };
    });
  }

  const expansionCache = await buildExpansionCache(autoDiscounts);

  return products.map((product) => {
    const p = typeof product.toObject === 'function' ? product.toObject() : product;
    const originalPrice = baseUnitPrice(p);
    const eligible = [];

    for (const d of autoDiscounts) {
      const minimumOrderAmount = Number(d.minimumOrderAmount) || 0;
      if (originalPrice < minimumOrderAmount) continue;

      const { categorySet, catalogCache } = expansionCache.get(String(d._id));
      if (lineEligibleForDiscount(p, d, categorySet, catalogCache)) {
        eligible.push(d);
      }
    }

    const winner = pickBestLineDiscount(originalPrice, eligible);
    const discountAmount = winner ? winner.discountAmount : 0;
    const discountedPrice = Number((originalPrice - discountAmount).toFixed(2));
    const discountPercentage =
      originalPrice > 0 ? Number(((discountAmount / originalPrice) * 100).toFixed(2)) : 0;

    return {
      ...p,
      originalPrice,
      discountAmount,
      discountPercentage,
      discountedPrice,
      hasActiveDiscount: discountAmount > 0,
      appliedDiscount: winner
        ? {
            _id: winner.discount._id,
            discountName: winner.discount.discountName,
            discountType: winner.discount.discountType,
            discountValue: winner.discount.discountValue,
            festivalTag: winner.discount.festivalTag || '',
            priority: winner.discount.priority,
            startDate: winner.discount.startDate,
            endDate: winner.discount.endDate,
          }
        : null,
    };
  });
}

module.exports = {
  baseUnitPrice,
  calculateOrderPricing,
  enrichProductsWithCampaignPricing,
  computeRawDiscountOnAmount,
  assertUsageAllowed,
};
