const asyncHandler = require('../utils/asyncHandler');
const discountService = require('../services/discountService');
const { invalidateListingDiscountCache } = require('../services/pricingEngine');

const bustListingPricingCache = () => invalidateListingDiscountCache();

exports.create = asyncHandler(async (req, res) => {
  const doc = await discountService.createDiscount(req.body, req.user._id);
  bustListingPricingCache();
  res.status(201).json({ success: true, message: 'Discount created', data: doc });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await discountService.updateDiscount(req.params.id, req.body);
  bustListingPricingCache();
  res.json({ success: true, message: 'Discount updated', data: doc });
});

exports.remove = asyncHandler(async (req, res) => {
  await discountService.deleteDiscount(req.params.id);
  bustListingPricingCache();
  res.json({ success: true, message: 'Discount deleted' });
});

exports.getById = asyncHandler(async (req, res) => {
  const doc = await discountService.getDiscountById(req.params.id);
  res.json({ success: true, data: doc });
});

exports.list = asyncHandler(async (req, res) => {
  const result = await discountService.listDiscounts(req.validatedQuery || req.query);
  res.json({ success: true, ...result });
});

exports.patchStatus = asyncHandler(async (req, res) => {
  const doc = await discountService.patchDiscountStatus(req.params.id, req.body.status);
  bustListingPricingCache();
  res.json({ success: true, message: 'Status updated', data: doc });
});

exports.validate = asyncHandler(async (req, res) => {
  const userId = req.user?._id ? String(req.user._id) : null;
  const result = await discountService.validateDiscountPayload({
    userId,
    items: req.body.items,
    discountCode: req.body.discountCode,
  });
  res.json({ success: true, message: 'Discount validation passed', data: result });
});

exports.calculate = asyncHandler(async (req, res) => {
  const userId = req.user?._id ? String(req.user._id) : null;
  const result = await discountService.calculateCart({
    userId,
    items: req.body.items,
    discountCode: req.body.discountCode,
  });
  res.json({
    success: true,
    message: 'Pricing calculated',
    data: {
      originalPrice: result.subtotal,
      discountAmount: result.discountTotal,
      discountPercentage:
        result.subtotal > 0
          ? Number(((result.discountTotal / result.subtotal) * 100).toFixed(2))
          : 0,
      finalPrice: result.finalTotal,
      appliedDiscountDetails: {
        couponCode: result.couponCode || null,
        stackingMode: result.stackingMode,
        appliedDiscountIds: result.appliedDiscountIds,
        lines: result.lines,
      },
    },
  });
});

exports.apply = asyncHandler(async (req, res) => {
  const userId = req.user?._id ? String(req.user._id) : null;
  const result = await discountService.calculateCart({
    userId,
    items: req.body.items,
    discountCode: req.body.discountCode,
  });
  res.json({
    success: true,
    message: 'Apply preview (persist at checkout via order API)',
    data: result,
  });
});

exports.analytics = asyncHandler(async (req, res) => {
  const data = await discountService.getDiscountAnalytics(req.params.id);
  res.json({ success: true, data });
});
