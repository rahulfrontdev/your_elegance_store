const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getWishlistResponse = async (userId) => {
  const user = await User.findById(userId)
    .select('wishlist')
    .populate('wishlist')
    .lean();

  return {
    success: true,
    count: user?.wishlist?.length || 0,
    data: user?.wishlist || [],
  };
};

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
  const response = await getWishlistResponse(req.user._id);
  return res.status(200).json(response);
};

// POST /api/wishlist/:productId
exports.addToWishlist = async (req, res) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: 'Invalid product id' });
  }

  const product = await Product.findById(productId).select('_id');
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: productId } },
    { new: true }
  );

  const response = await getWishlistResponse(req.user._id);
  return res.status(200).json(response);
};

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: 'Invalid product id' });
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: productId } },
    { new: true }
  );

  const response = await getWishlistResponse(req.user._id);
  return res.status(200).json(response);
};

// DELETE /api/wishlist
exports.clearWishlist = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { wishlist: [] } },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message: 'Wishlist cleared',
    count: 0,
    data: [],
  });
};

// GET /api/wishlist/:productId/status
exports.getWishlistStatus = async (req, res) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: 'Invalid product id' });
  }

  const user = await User.findById(req.user._id).select('wishlist').lean();
  const isWishlisted = (user?.wishlist || []).some(
    (id) => String(id) === String(productId)
  );

  return res.status(200).json({
    success: true,
    data: { productId, isWishlisted },
  });
};

// POST /api/wishlist/toggle/:productId
exports.toggleWishlist = async (req, res) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: 'Invalid product id' });
  }

  const product = await Product.findById(productId).select('_id');
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const user = await User.findById(req.user._id).select('wishlist');
  const exists = user.wishlist.some((id) => String(id) === String(productId));

  await User.findByIdAndUpdate(
    req.user._id,
    exists
      ? { $pull: { wishlist: productId } }
      : { $addToSet: { wishlist: productId } }
  );

  const response = await getWishlistResponse(req.user._id);
  return res.status(200).json({
    ...response,
    action: exists ? 'removed' : 'added',
  });
};

