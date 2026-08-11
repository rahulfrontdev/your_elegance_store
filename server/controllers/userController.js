const mongoose = require('mongoose');
const User = require('../models/User');
const Address = require('../models/Address');
const SpecialDiscountCategory = require('../models/SpecialDiscountCategory');
const { getDefaultSpecialDiscountCategoryId } = require('../services/specialDiscountService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeSpecialDiscountCategory = (value) => {
  if (!value) return null;
  if (typeof value === 'object') {
    return {
      _id: value._id,
      name: value.name,
      discountPercentage: value.discountPercentage,
      isDefault: Boolean(value.isDefault),
      isActive: value.isActive !== false,
    };
  }
  return { _id: value };
};

const serializeUser = (user) => {
  if (!user) return null;
  const doc = typeof user.toObject === 'function' ? user.toObject() : user;
  return {
    _id: doc._id,
    name: doc.name,
    mobile: doc.mobile,
    email: doc.email || null,
    role: doc.role,
    specialDiscountCategory: serializeSpecialDiscountCategory(doc.specialDiscountCategory),
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
      .populate('specialDiscountCategory', 'name discountPercentage isDefault isActive')
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

    const user = await User.findById(id)
      .select('-password -wishlist')
      .populate('specialDiscountCategory', 'name discountPercentage isDefault isActive')
      .lean();
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
 * Admin can update role and/or special discount category.
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const updates = {};
    const role = req.body?.role !== undefined ? String(req.body.role).trim().toLowerCase() : undefined;
    const specialDiscountCategory =
      req.body?.specialDiscountCategory !== undefined
        ? req.body.specialDiscountCategory
        : req.body?.specialDiscountCategoryId;

    if (role !== undefined) {
      if (!['customer', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Role must be customer or admin' });
      }
      if (String(req.user._id) === String(id) && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot remove your own admin role' });
      }
      updates.role = role;
    }

    if (specialDiscountCategory !== undefined) {
      if (specialDiscountCategory === null || specialDiscountCategory === '') {
        updates.specialDiscountCategory = await getDefaultSpecialDiscountCategoryId();
      } else if (!isValidObjectId(specialDiscountCategory)) {
        return res.status(400).json({ message: 'Invalid special discount category id' });
      } else {
        const category = await SpecialDiscountCategory.findById(specialDiscountCategory);
        if (!category || category.isActive === false) {
          return res.status(400).json({ message: 'Special discount category not found or inactive' });
        }
        updates.specialDiscountCategory = category._id;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .select('-password -wishlist')
      .populate('specialDiscountCategory', 'name discountPercentage isDefault isActive');

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
