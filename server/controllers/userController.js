const mongoose = require('mongoose');
const User = require('../models/User');
const Address = require('../models/Address');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeUser = (user) => {
  if (!user) return null;
  const doc = typeof user.toObject === 'function' ? user.toObject() : user;
  return {
    _id: doc._id,
    name: doc.name,
    mobile: doc.mobile,
    email: doc.email || null,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * GET /api/users
 * Query: role=customer|admin|all (default: all)
 *        q=search name/email/mobile
 */
const getUsers = async (req, res) => {
  try {
    const roleFilter = String(req.query.role || 'all').trim().toLowerCase();
    const search = String(req.query.q || '').trim();

    const filter = {};
    if (roleFilter === 'customer' || roleFilter === 'admin') {
      filter.role = roleFilter;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { mobile: regex }];
    }

    const users = await User.find(filter)
      .select('-password -wishlist')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: users.length,
      data: users.map(serializeUser),
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/users/:id
 * Includes saved addresses for customer detail view.
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(id).select('-password -wishlist').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addresses = await Address.find({ userId: id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        ...serializeUser(user),
        addresses,
      },
    });
  } catch (error) {
    console.error('Get user by id error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PATCH /api/users/:id
 * Admin can update role only (safe fields).
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const role = req.body?.role !== undefined ? String(req.body.role).trim().toLowerCase() : undefined;
    if (role !== undefined && !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be customer or admin' });
    }

    if (role === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    // Prevent an admin from demoting themselves accidentally
    if (String(req.user._id) === String(id) && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'User updated',
      data: serializeUser(user),
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
};
