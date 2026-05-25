const mongoose = require('mongoose');
const Discount = require('../models/Discount');
const DiscountUsage = require('../models/DiscountUsage');
const Order = require('../models/Order');
const { calculateOrderPricing } = require('./pricingEngine');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const deriveInitialStatus = (body) => {
  const now = new Date();
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (end < now) return 'expired';
  if (start > now) return 'scheduled';
  return 'active';
};

exports.createDiscount = async (body, adminId) => {
  const payload = { ...body, createdBy: adminId };
  if (!payload.status) {
    payload.status = deriveInitialStatus(payload);
  }
  return Discount.create(payload);
};

exports.updateDiscount = async (id, body) => {
  if (!isValidObjectId(id)) {
    const err = new Error('Invalid discount id');
    err.statusCode = 400;
    throw err;
  }
  const doc = await Discount.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Discount not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.deleteDiscount = async (id) => {
  if (!isValidObjectId(id)) {
    const err = new Error('Invalid discount id');
    err.statusCode = 400;
    throw err;
  }
  const doc = await Discount.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Discount not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.getDiscountById = async (id) => {
  if (!isValidObjectId(id)) {
    const err = new Error('Invalid discount id');
    err.statusCode = 400;
    throw err;
  }
  const doc = await Discount.findById(id).lean();
  if (!doc) {
    const err = new Error('Discount not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.listDiscounts = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.applicableOn) filter.applicableOn = query.applicableOn;
  if (query.festivalTag) {
    const esc = String(query.festivalTag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.festivalTag = new RegExp(`^${esc}$`, 'i');
  }
  if (query.applicableOn) filter.applicableOn = query.applicableOn;

  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const limitRaw = Number.parseInt(String(query.limit || '30'), 10);
  const limit = Number.isNaN(limitRaw) ? 30 : Math.min(100, Math.max(1, limitRaw));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Discount.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Discount.countDocuments(filter),
  ]);

  return { data, total, page, limit, pages: total === 0 ? 1 : Math.ceil(total / limit) };
};

exports.patchDiscountStatus = async (id, status) => {
  if (!isValidObjectId(id)) {
    const err = new Error('Invalid discount id');
    err.statusCode = 400;
    throw err;
  }
  const allowed = ['draft', 'scheduled', 'active', 'inactive', 'expired'];
  if (!allowed.includes(status)) {
    const err = new Error(`status must be one of: ${allowed.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const doc = await Discount.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Discount not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.validateDiscountPayload = async ({ userId, items, discountCode }) => {
  const pricing = await calculateOrderPricing({ userId, items, discountCode });
  return {
    valid: true,
    ...pricing,
  };
};

exports.calculateCart = async ({ userId, items, discountCode }) => calculateOrderPricing({ userId, items, discountCode });

/**
 * Idempotent per (order, discount): records usage and increments redemption counters.
 * Call after COD order creation or after ONLINE payment verification succeeds.
 */
exports.recordDiscountUsageForOrder = async (orderId) => {
  if (!isValidObjectId(orderId)) return;
  const order = await Order.findById(orderId).lean();
  if (!order?.appliedDiscountSnapshot?.lines?.length) return;

  const snap = order.appliedDiscountSnapshot;
  const discountIds = [
    ...new Set(
      snap.lines.map((l) => l.appliedDiscountId).filter(Boolean).map((id) => String(id))
    ),
  ];

  for (const discountId of discountIds) {
    const exists = await DiscountUsage.findOne({
      order: orderId,
      discount: discountId,
    }).lean();
    if (exists) continue;

    const amountSaved = snap.lines
      .filter((l) => String(l.appliedDiscountId) === discountId)
      .reduce((sum, l) => sum + (Number(l.discountAmount) || 0), 0);

    await DiscountUsage.create({
      discount: discountId,
      user: order.user || null,
      order: orderId,
      codeUsed: snap.couponCode || '',
      amountSaved: Number(amountSaved.toFixed(2)),
    });

    await Discount.findByIdAndUpdate(discountId, { $inc: { totalRedemptions: 1 } });
  }
};

exports.getDiscountAnalytics = async (id) => {
  if (!isValidObjectId(id)) {
    const err = new Error('Invalid discount id');
    err.statusCode = 400;
    throw err;
  }
  const discount = await Discount.findById(id).lean();
  if (!discount) {
    const err = new Error('Discount not found');
    err.statusCode = 404;
    throw err;
  }

  const [agg] = await DiscountUsage.aggregate([
    { $match: { discount: new mongoose.Types.ObjectId(id) } },
    {
      $group: {
        _id: null,
        totalUsages: { $sum: 1 },
        totalSaved: { $sum: '$amountSaved' },
      },
    },
  ]);

  const recent = await DiscountUsage.find({ discount: id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('user', 'name mobile email')
    .populate('order', 'orderId totalAmount paymentStatus')
    .lean();

  return {
    discount: { _id: discount._id, discountName: discount.discountName, discountCode: discount.discountCode },
    totalUsages: agg?.totalUsages || 0,
    totalSaved: Number((agg?.totalSaved || 0).toFixed(2)),
    totalRedemptionsField: discount.totalRedemptions || 0,
    recentUsages: recent,
  };
};
