const mongoose = require('mongoose');
const User = require('../models/User');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function buildOrderSearchFilter(searchTerm, { lookupUsers = false } = {}) {
  const term = String(searchTerm || '').trim();
  if (!term) return null;

  const regex = new RegExp(escapeRegex(term), 'i');
  const orConditions = [
    { orderId: regex },
    { 'items.name': regex },
    { 'items.sku': regex },
    { 'shippingAddress.fullName': regex },
    { 'shippingAddress.mobile': regex },
  ];

  if (isValidObjectId(term)) {
    orConditions.push({ _id: new mongoose.Types.ObjectId(term) });
  }

  if (lookupUsers) {
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }, { mobile: regex }],
    })
      .select('_id')
      .limit(50)
      .lean();

    if (users.length) {
      orConditions.push({ user: { $in: users.map((user) => user._id) } });
    }
  }

  return { $or: orConditions };
}

module.exports = { buildOrderSearchFilter };
