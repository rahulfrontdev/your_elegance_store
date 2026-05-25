const Joi = require('joi');

const phonePattern = /^[0-9+\-\s()]{7,20}$/;
const postalCodePattern = /^[a-zA-Z0-9\-\s]{3,20}$/;

const optionalText = (max) => Joi.string().trim().max(max).allow('');

const createAddressFields = {
  fullName: Joi.string().trim().min(2).max(100).required(),
  mobileNumber: Joi.string().trim().pattern(phonePattern).required().messages({
    'string.pattern.base': 'mobileNumber must be a valid phone number',
  }),
  alternateMobileNumber: Joi.string().trim().pattern(phonePattern).allow('').default('').messages({
    'string.pattern.base': 'alternateMobileNumber must be a valid phone number',
  }),
  addressLine1: Joi.string().trim().min(5).max(200).required(),
  addressLine2: optionalText(200).default(''),
  landmark: optionalText(120).default(''),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().min(2).max(80).required(),
  country: Joi.string().trim().min(2).max(80).default('India'),
  postalCode: Joi.string().trim().pattern(postalCodePattern).required().messages({
    'string.pattern.base': 'postalCode must be a valid postal code',
  }),
  addressType: Joi.string().valid('Home', 'Office', 'Other').default('Home'),
  isDefault: Joi.boolean().optional(),
};

const updateAddressFields = {
  fullName: Joi.string().trim().min(2).max(100).optional(),
  mobileNumber: Joi.string().trim().pattern(phonePattern).optional().messages({
    'string.pattern.base': 'mobileNumber must be a valid phone number',
  }),
  alternateMobileNumber: Joi.string().trim().pattern(phonePattern).allow('').optional().messages({
    'string.pattern.base': 'alternateMobileNumber must be a valid phone number',
  }),
  addressLine1: Joi.string().trim().min(5).max(200).optional(),
  addressLine2: optionalText(200).optional(),
  landmark: optionalText(120).optional(),
  city: Joi.string().trim().min(2).max(80).optional(),
  state: Joi.string().trim().min(2).max(80).optional(),
  country: Joi.string().trim().min(2).max(80).optional(),
  postalCode: Joi.string().trim().pattern(postalCodePattern).optional().messages({
    'string.pattern.base': 'postalCode must be a valid postal code',
  }),
  addressType: Joi.string().valid('Home', 'Office', 'Other').optional(),
  isDefault: Joi.boolean().optional(),
};

const createAddressSchema = Joi.object(createAddressFields);

const updateAddressSchema = Joi.object(updateAddressFields).min(1);

const listAddressQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  city: Joi.string().trim().max(80).optional(),
  state: Joi.string().trim().max(80).optional(),
  search: Joi.string().trim().max(80).optional(),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  listAddressQuerySchema,
};
