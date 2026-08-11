const User = require('../models/User');
const SpecialDiscountCategory = require('../models/SpecialDiscountCategory');

const DEFAULT_CATEGORY_NAME = 'Customer';

async function ensureDefaultSpecialDiscountCategory() {
  let category = await SpecialDiscountCategory.findOne({ isDefault: true });
  if (!category) {
    category = await SpecialDiscountCategory.findOne({
      name: new RegExp(`^${DEFAULT_CATEGORY_NAME}$`, 'i'),
    });
  }
  if (!category) {
    category = await SpecialDiscountCategory.create({
      name: DEFAULT_CATEGORY_NAME,
      discountPercentage: 0,
      isDefault: true,
      isActive: true,
    });
  } else if (!category.isDefault) {
    category.isDefault = true;
    if (category.discountPercentage == null) category.discountPercentage = 0;
    await category.save();
  }

  await User.updateMany(
    {
      role: 'customer',
      $or: [{ specialDiscountCategory: null }, { specialDiscountCategory: { $exists: false } }],
    },
    { $set: { specialDiscountCategory: category._id } }
  );

  return category;
}

async function getDefaultSpecialDiscountCategoryId() {
  const category = await ensureDefaultSpecialDiscountCategory();
  return category._id;
}

async function getUserSpecialDiscountInfo(userId) {
  if (!userId) {
    return { percent: 0, categoryName: '', categoryId: null };
  }

  const user = await User.findById(userId)
    .select('specialDiscountCategory role')
    .populate('specialDiscountCategory', 'name discountPercentage isActive isDefault')
    .lean();

  if (!user || user.role === 'admin') {
    return { percent: 0, categoryName: '', categoryId: null };
  }

  let category = user.specialDiscountCategory;
  if (!category) {
    const defaultId = await getDefaultSpecialDiscountCategoryId();
    await User.updateOne({ _id: userId }, { $set: { specialDiscountCategory: defaultId } });
    category = await SpecialDiscountCategory.findById(defaultId).lean();
  }

  if (!category || category.isActive === false) {
    return { percent: 0, categoryName: '', categoryId: null };
  }

  return {
    percent: Number(category.discountPercentage) || 0,
    categoryName: String(category.name || '').trim(),
    categoryId: category._id,
  };
}

function computeSpecialDiscountAmount(amount, percent) {
  const base = Number(amount) || 0;
  const rate = Number(percent) || 0;
  if (base <= 0 || rate <= 0) return 0;
  return Number((base * rate) / 100).toFixed(2) * 1;
}

function pickBestDiscount(originalPrice, campaignWinner, specialInfo) {
  const campaignAmount = campaignWinner ? Number(campaignWinner.discountAmount) || 0 : 0;
  const specialAmount = computeSpecialDiscountAmount(originalPrice, specialInfo?.percent);

  if (specialAmount > campaignAmount) {
    return {
      discountAmount: specialAmount,
      appliedDiscount: specialAmount
        ? {
            discountName: specialInfo.categoryName
              ? `${specialInfo.categoryName} price`
              : 'Special discount',
            discountType: 'percentage',
            discountValue: specialInfo.percent,
            source: 'special',
            specialDiscountCategoryId: specialInfo.categoryId,
          }
        : null,
      source: 'special',
    };
  }

  if (campaignAmount > 0 && campaignWinner?.discount) {
    return {
      discountAmount: campaignAmount,
      appliedDiscount: {
        _id: campaignWinner.discount._id,
        discountName: campaignWinner.discount.discountName,
        discountType: campaignWinner.discount.discountType,
        discountValue: campaignWinner.discount.discountValue,
        festivalTag: campaignWinner.discount.festivalTag || '',
        priority: campaignWinner.discount.priority,
        startDate: campaignWinner.discount.startDate,
        endDate: campaignWinner.discount.endDate,
        source: 'campaign',
      },
      source: 'campaign',
    };
  }

  return { discountAmount: 0, appliedDiscount: null, source: 'none' };
}

module.exports = {
  DEFAULT_CATEGORY_NAME,
  ensureDefaultSpecialDiscountCategory,
  getDefaultSpecialDiscountCategoryId,
  getUserSpecialDiscountInfo,
  computeSpecialDiscountAmount,
  pickBestDiscount,
};
