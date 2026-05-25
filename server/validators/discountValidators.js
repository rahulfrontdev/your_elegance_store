const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const discountBase = {
  discountName: Joi.string().trim().min(2).max(200).required(),
  discountCode: Joi.string().trim().uppercase().max(40).allow('', null).optional(),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().min(0).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  minimumOrderAmount: Joi.number().min(0).default(0),
  maximumDiscountAmount: Joi.number().min(0).allow(null).optional(),
  applicableOn: Joi.string().valid('catalog', 'category', 'product').required(),
  catalogIds: Joi.array().items(objectId).default([]),
  categoryIds: Joi.array().items(objectId).default([]),
  productIds: Joi.array().items(objectId).default([]),
  usageLimit: Joi.number().integer().min(1).allow(null).optional(),
  usagePerUser: Joi.number().integer().min(1).allow(null).optional(),
  priority: Joi.number().integer().default(0),
  festivalTag: Joi.string().trim().max(80).allow('').optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  status: Joi.string()
    .valid('draft', 'scheduled', 'active', 'inactive', 'expired')
    .optional(),
};

exports.createDiscountSchema = Joi.object({
  ...discountBase,
}).custom((value, helpers) => {
  if (value.applicableOn === 'catalog' && (!value.catalogIds || value.catalogIds.length === 0)) {
    return helpers.message('catalogIds is required with at least one id when applicableOn is catalog');
  }
  if (value.applicableOn === 'category' && (!value.categoryIds || value.categoryIds.length === 0)) {
    return helpers.message('categoryIds is required with at least one id when applicableOn is category');
  }
  if (value.applicableOn === 'product' && (!value.productIds || value.productIds.length === 0)) {
    return helpers.message('productIds is required with at least one MongoDB ObjectId when applicableOn is product');
  }
  if (value.discountType === 'percentage' && value.discountValue > 100) {
    return helpers.message('percentage discountValue cannot exceed 100');
  }
  return value;
});

exports.updateDiscountSchema = Joi.object({
  discountName: discountBase.discountName.optional(),
  discountCode: discountBase.discountCode,
  discountType: discountBase.discountType.optional(),
  discountValue: discountBase.discountValue.optional(),
  startDate: discountBase.startDate.optional(),
  endDate: discountBase.endDate.optional(),
  minimumOrderAmount: discountBase.minimumOrderAmount.optional(),
  maximumDiscountAmount: discountBase.maximumDiscountAmount,
  applicableOn: discountBase.applicableOn.optional(),
  catalogIds: discountBase.catalogIds.optional(),
  categoryIds: discountBase.categoryIds.optional(),
  productIds: discountBase.productIds.optional(),
  usageLimit: discountBase.usageLimit,
  usagePerUser: discountBase.usagePerUser,
  priority: discountBase.priority.optional(),
  festivalTag: discountBase.festivalTag,
  description: discountBase.description,
  status: discountBase.status,
})
  .custom((value, helpers) => {
    if (value.discountType === 'percentage' && value.discountValue != null && value.discountValue > 100) {
      return helpers.message('percentage discountValue cannot exceed 100');
    }
    return value;
  });

exports.patchDiscountStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'scheduled', 'active', 'inactive', 'expired').required(),
});

const cartItemSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
});

exports.validateCartSchema = Joi.object({
  items: Joi.array().items(cartItemSchema).min(1).required(),
  discountCode: Joi.string().trim().allow('').optional(),
});

exports.listDiscountQuerySchema = Joi.object({
  status: Joi.string().valid('draft', 'scheduled', 'active', 'inactive', 'expired').optional(),
  applicableOn: Joi.string().valid('catalog', 'category', 'product').optional(),
  festivalTag: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
