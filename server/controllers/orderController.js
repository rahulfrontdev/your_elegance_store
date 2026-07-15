const crypto = require('crypto');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { getRazorpayClient } = require('../utils/razorpay');
const { calculateOrderPricing } = require('../services/pricingEngine');
const discountService = require('../services/discountService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { recalculateApprovedRating } = require('../utils/reviewUtils');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const CANCELABLE_ORDER_STATUSES = ['Pending', 'Confirmed'];
const ORDER_STATUS_ALIASES = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  canceled: 'Cancelled',
  cancelled: 'Cancelled',
};

const normalizeOrderStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  return ORDER_STATUS_ALIASES[normalized] || null;
};

const validateShippingAddress = (address = {}) => {
  const required = [
    'fullName',
    'mobile',
    'addressLine1',
    'city',
    'state',
    'pincode',
    'country',
  ];
  for (const key of required) {
    if (!String(address[key] || '').trim()) {
      return `${key} is required`;
    }
  }
  return null;
};

const mapItemsAndTotal = async (items = [], userId = null, discountCode = '') => {
  const pricing = await calculateOrderPricing({
    userId,
    items,
    discountCode: discountCode ? String(discountCode).trim() : undefined,
  });

  const normalizedItems = pricing.lines.map((l) => {
    const row = {
      productId: l.productId,
      name: l.name,
      image: l.image,
      quantity: l.quantity,
      price: Number((l.finalLineTotal / l.quantity).toFixed(2)),
      unitOriginalPrice: l.unitOriginalPrice,
      lineDiscountAmount: l.discountAmount,
      lineFinalTotal: l.finalLineTotal,
    };
    if (l.appliedDiscountId) {
      row.appliedDiscountId = l.appliedDiscountId;
      row.appliedDiscountName = l.appliedDiscountName || '';
    }
    return row;
  });

  const appliedDiscountSnapshot = {
    subtotal: pricing.subtotal,
    discountTotal: pricing.discountTotal,
    finalTotal: pricing.finalTotal,
    couponCode: pricing.couponCode || '',
    appliedDiscountIds: pricing.appliedDiscountIds || [],
    lines: pricing.lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      quantity: l.quantity,
      unitOriginalPrice: l.unitOriginalPrice,
      lineSubtotal: l.lineSubtotal,
      discountAmount: l.discountAmount,
      finalLineTotal: l.finalLineTotal,
      appliedDiscountId: l.appliedDiscountId || null,
      appliedDiscountName: l.appliedDiscountName || '',
      discountType: l.discountType || '',
    })),
  };

  return {
    normalizedItems,
    totalAmount: Number(pricing.finalTotal.toFixed(2)),
    appliedDiscountSnapshot,
  };
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

const withAddressFields = (order) => {
  if (!order) return order;
  const sa = order.shippingAddress;
  if (!sa || typeof sa !== 'object') {
    return { ...order, address: {}, formattedAddress: '' };
  }
  const address = {
    fullName: sa.fullName,
    mobile: sa.mobile,
    addressLine1: sa.addressLine1,
    addressLine2: sa.addressLine2 || '',
    city: sa.city,
    state: sa.state,
    pincode: sa.pincode,
    country: sa.country,
  };
  const street = [address.addressLine1, address.addressLine2].filter(Boolean).join(', ');
  const cityState = [address.city, address.state].filter(Boolean).join(', ');
  const tail = [address.pincode, address.country].filter(Boolean).join(' ');
  const formattedAddress = [street, cityState, tail].filter(Boolean).join(', ');

  return { ...order, address, formattedAddress };
};

const attachImagesToOrders = async (orders = []) => {
  const missingImageProductIds = new Set();

  for (const order of orders) {
    for (const item of order.items || []) {
      if (!String(item.image || '').trim() && item.productId) {
        missingImageProductIds.add(String(item.productId));
      }
    }
  }

  const imageByProductId = new Map();
  if (missingImageProductIds.size > 0) {
    const products = await Product.find(
      { _id: { $in: Array.from(missingImageProductIds) } },
      { imageUrl: 1, images: 1 }
    ).lean();
    for (const p of products) {
      imageByProductId.set(String(p._id), pickProductImage(p));
    }
  }

  return orders.map((order) =>
    withAddressFields({
      ...order,
      items: (order.items || []).map((item) => {
        if (String(item.image || '').trim()) return item;
        return { ...item, image: imageByProductId.get(String(item.productId)) || '' };
      }),
    })
  );
};

const canReviewOrder = (order) => {
  if (!order) return false;
  return order.orderStatus === 'Delivered';
};

// POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('items are required');
  }
  if (!paymentMethod || !['COD', 'ONLINE'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('paymentMethod must be COD or ONLINE');
  }

  const addressError = validateShippingAddress(shippingAddress);
  if (addressError) {
    res.status(400);
    throw new Error(addressError);
  }

  const discountCode = String(req.body.discountCode || '').trim();
  const { normalizedItems, totalAmount, appliedDiscountSnapshot } = await mapItemsAndTotal(
    items,
    req.user?._id ? String(req.user._id) : null,
    discountCode
  );

  const order = await Order.create({
    user: req.user?._id || null,
    items: normalizedItems,
    shippingAddress: {
      fullName: String(shippingAddress.fullName).trim(),
      mobile: String(shippingAddress.mobile).trim(),
      addressLine1: String(shippingAddress.addressLine1).trim(),
      addressLine2: String(shippingAddress.addressLine2 || '').trim(),
      city: String(shippingAddress.city).trim(),
      state: String(shippingAddress.state).trim(),
      pincode: String(shippingAddress.pincode).trim(),
      country: String(shippingAddress.country).trim(),
    },
    totalAmount,
    paymentMethod,
    paymentStatus: 'Pending',
    orderStatus: paymentMethod === 'COD' ? 'Confirmed' : 'Pending',
    appliedDiscountSnapshot,
  });

  if (paymentMethod === 'COD') {
    await discountService.recordDiscountUsageForOrder(order._id);
    const [orderPayload] = await attachImagesToOrders([order.toObject()]);
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully (COD)',
      data: orderPayload,
    });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    res.status(500);
    throw new Error('Razorpay keys are missing in environment');
  }

  const razorpay = getRazorpayClient();
  const rzOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'INR',
    receipt: order.orderId,
    notes: {
      localOrderId: String(order._id),
      customerName: order.shippingAddress.fullName,
      customerMobile: order.shippingAddress.mobile,
    },
  });

  order.razorpayOrderId = rzOrder.id;
  await order.save();

  const [orderPayload] = await attachImagesToOrders([order.toObject()]);
  return res.status(201).json({
    success: true,
    message: 'Order created. Proceed to payment.',
    data: orderPayload,
    razorpayOrder: {
      id: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// POST /api/orders/verify-payment
exports.verifyPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error('orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature are required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const isValid = expectedSignature === razorpaySignature;

  if (isValid) {
    order.paymentStatus = 'Paid';
    order.orderStatus = 'Confirmed';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    await discountService.recordDiscountUsageForOrder(order._id);

    const [orderPayload] = await attachImagesToOrders([order.toObject()]);
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: orderPayload,
    });
  }

  order.paymentStatus = 'Failed';
  await order.save();

  const [failedOrderPayload] = await attachImagesToOrders([order.toObject()]);
  return res.status(400).json({
    success: false,
    message: 'Invalid payment signature',
    data: failedOrderPayload,
  });
});

// GET /api/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }

  const order = await Order.findById(id).populate('user', 'name email mobile role').lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (req.user && req.user.role !== 'admin' && String(order.user?._id || '') !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  const [orderWithImages] = await attachImagesToOrders([order]);
  return res.status(200).json({ success: true, data: orderWithImages });
});

// GET /api/orders/admin/all (admin dashboard)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
  const limitRaw = Number.parseInt(String(req.query.limit || '50'), 10);
  const limit = Number.isNaN(limitRaw) ? 50 : Math.min(100, Math.max(1, limitRaw));
  const skip = (page - 1) * limit;

  const filter = {};
  const paymentStatus = String(req.query.paymentStatus || '').trim();
  if (['Pending', 'Paid', 'Failed'].includes(paymentStatus)) {
    filter.paymentStatus = paymentStatus;
  }
  const orderStatus = normalizeOrderStatus(req.query.orderStatus);
  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email mobile role')
      .lean(),
    Order.countDocuments(filter),
  ]);

  const ordersWithImages = await attachImagesToOrders(orders);
  const pages = total === 0 ? 1 : Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    count: ordersWithImages.length,
    total,
    page,
    limit,
    pages,
    data: ordersWithImages,
  });
});

// PATCH /api/orders/admin/:id/status
exports.updateOrderStatusByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }

  const nextStatus = normalizeOrderStatus(req.body?.orderStatus || req.body?.status);

  if (!nextStatus) {
    res.status(400);
    throw new Error('orderStatus must be one of Pending, Confirmed, Shipped, Delivered, or Canceled');
  }

  const order = await Order.findById(id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = nextStatus;

  if (nextStatus === 'Delivered') {
    order.paymentStatus = 'Paid';
  }

  if (nextStatus === 'Cancelled') {
    const reason = String(req.body?.reason || 'Cancelled by admin').trim();
    if (reason.length > 300) {
      res.status(400);
      throw new Error('Cancellation reason cannot exceed 300 characters');
    }

    order.cancellation = {
      cancelledAt: order.cancellation?.cancelledAt || new Date(),
      cancelledBy: req.user._id,
      reason,
    };
  } else {
    order.cancellation = {
      cancelledAt: null,
      cancelledBy: null,
      reason: '',
    };
  }

  await order.save();

  const [orderPayload] = await attachImagesToOrders([order.toObject()]);

  return res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: orderPayload,
  });
});

// GET /api/orders/user/:userId
exports.getOrdersByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    res.status(400);
    throw new Error('Invalid user id');
  }

  if (req.user && req.user.role !== 'admin' && String(req.user._id) !== String(userId)) {
    res.status(403);
    throw new Error('Not authorized to view these orders');
  }

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  const ordersWithImages = await attachImagesToOrders(orders);
  return res.status(200).json({ success: true, count: ordersWithImages.length, data: ordersWithImages });
});

// GET /api/orders/my/:id
exports.getMyOrderDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }

  const order = await Order.findOne({ _id: id, user: req.user._id })
    .populate('user', 'name email mobile role')
    .lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const [orderWithImages] = await attachImagesToOrders([order]);
  return res.status(200).json({ success: true, data: orderWithImages });
});

// PATCH /api/orders/:id/cancel
exports.cancelMyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }

  const order = await Order.findOne({ _id: id, user: req.user._id });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.orderStatus === 'Cancelled') {
    res.status(400);
    throw new Error('Order is already cancelled');
  }

  if (!CANCELABLE_ORDER_STATUSES.includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Order cannot be cancelled after it is shipped or delivered');
  }

  const reason = String(req.body?.reason || '').trim();

  if (reason.length > 300) {
    res.status(400);
    throw new Error('Cancellation reason cannot exceed 300 characters');
  }

  order.orderStatus = 'Cancelled';
  order.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: req.user._id,
    reason,
  };

  await order.save();

  const [orderPayload] = await attachImagesToOrders([order.toObject()]);

  return res.status(200).json({
    success: true,
    message:
      order.paymentMethod === 'ONLINE' && order.paymentStatus === 'Paid'
        ? 'Order cancelled successfully. Refund will be processed separately.'
        : 'Order cancelled successfully',
    data: orderPayload,
  });
});

// POST /api/orders/:orderId/review
exports.addProductReview = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { productId, rating, comment } = req.body;

  if (!isValidObjectId(orderId)) {
    res.status(400);
    throw new Error('Invalid order id');
  }
  if (!isValidObjectId(productId)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const parsedRating = Number(rating);
  if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400);
    throw new Error('rating must be a number between 1 and 5');
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id }).lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!canReviewOrder(order)) {
    res.status(400);
    throw new Error('You can review only after successful order');
  }

  const hasProductInOrder = (order.items || []).some(
    (item) => String(item.productId) === String(productId)
  );
  if (!hasProductInOrder) {
    res.status(400);
    throw new Error('This product is not part of the selected order');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const existingReview = product.reviews.find(
    (review) => String(review.user) === String(req.user._id)
  );

  if (existingReview) {
    existingReview.rating = parsedRating;
    existingReview.comment = String(comment || '').trim();
    existingReview.name = req.user.name;
    existingReview.orderId = order._id;
    // Re-submit for moderation whenever the customer edits
    existingReview.status = 'pending';
    existingReview.moderatedAt = null;
    existingReview.moderatedBy = null;
  } else {
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating: parsedRating,
      comment: String(comment || '').trim(),
      status: 'pending',
      orderId: order._id,
    });
  }

  recalculateApprovedRating(product);

  await product.save();

  return res.status(existingReview ? 200 : 201).json({
    success: true,
    message: existingReview
      ? 'Review updated and sent for admin approval'
      : 'Review submitted and waiting for admin approval',
    data: {
      productId: product._id,
      rating: product.rating,
      numReviews: product.numReviews,
      status: 'pending',
    },
  });
});

