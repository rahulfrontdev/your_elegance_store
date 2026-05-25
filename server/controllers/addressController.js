const Address = require('../models/Address');
const { sendSuccess, sendError, getPaginationMeta } = require('../utils/apiResponse');

const MAX_ADDRESSES_PER_USER = 3;

const addressFields = [
  'fullName',
  'mobileNumber',
  'alternateMobileNumber',
  'addressLine1',
  'addressLine2',
  'landmark',
  'city',
  'state',
  'country',
  'postalCode',
  'addressType',
  'isDefault',
];

const getUserId = (req) => req.user?._id || req.user?.id;

const pickAddressPayload = (body) =>
  addressFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }

    return payload;
  }, {});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAddressFilter = (userId, query) => {
  const filter = { userId };

  if (query.city) {
    filter.city = { $regex: escapeRegex(query.city), $options: 'i' };
  }

  if (query.state) {
    filter.state = { $regex: escapeRegex(query.state), $options: 'i' };
  }

  if (query.search) {
    const searchRegex = { $regex: escapeRegex(query.search), $options: 'i' };
    filter.$or = [{ city: searchRegex }, { state: searchRegex }];
  }

  return filter;
};

const findOwnedAddress = (userId, addressId) =>
  Address.findOne({ _id: addressId, userId });

const handleControllerError = (res, error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);
    return sendError(res, 400, 'Address validation failed', errors);
  }

  if (error.name === 'CastError') {
    return sendError(res, 400, 'Invalid address id');
  }

  if (error.code === 11000) {
    return sendError(res, 409, 'Only one default address is allowed per user');
  }

  console.error('Address controller error:', error);
  return sendError(res, 500, 'Internal server error');
};

exports.addAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const currentAddressCount = await Address.countDocuments({ userId });

    if (currentAddressCount >= MAX_ADDRESSES_PER_USER) {
      return sendError(res, 409, 'Maximum 3 addresses are allowed per user');
    }

    const payload = pickAddressPayload(req.body);
    const shouldSetDefault = currentAddressCount === 0 || payload.isDefault === true;

    if (shouldSetDefault) {
      await Address.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      ...payload,
      userId,
      isDefault: shouldSetDefault,
    });

    return sendSuccess(res, 201, 'Address added successfully', address);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const query = req.validatedQuery || req.query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = buildAddressFilter(userId, query);

    const [addresses, total] = await Promise.all([
      Address.find(filter)
        .sort({ isDefault: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Address.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      200,
      'Addresses fetched successfully',
      addresses,
      getPaginationMeta({ page, limit, total })
    );
  } catch (error) {
    return handleControllerError(res, error);
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const address = await findOwnedAddress(userId, req.params.id).lean();

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    return sendSuccess(res, 200, 'Address fetched successfully', address);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const address = await findOwnedAddress(userId, req.params.id);

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    const payload = pickAddressPayload(req.body);

    if (payload.isDefault === true) {
      await Address.updateMany(
        { userId, _id: { $ne: address._id }, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    if (payload.isDefault === false && address.isDefault) {
      const anotherDefaultExists = await Address.exists({
        userId,
        _id: { $ne: address._id },
        isDefault: true,
      });

      if (!anotherDefaultExists) {
        return sendError(res, 400, 'At least one address must remain default');
      }
    }

    Object.assign(address, payload);
    const updatedAddress = await address.save();

    return sendSuccess(res, 200, 'Address updated successfully', updatedAddress);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const address = await findOwnedAddress(userId, req.params.id);

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    if (wasDefault) {
      await Address.findOneAndUpdate(
        { userId },
        { $set: { isDefault: true } },
        { sort: { updatedAt: -1 }, new: true }
      );
    }

    return sendSuccess(res, 200, 'Address deleted successfully');
  } catch (error) {
    return handleControllerError(res, error);
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const address = await findOwnedAddress(userId, req.params.id);

    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    if (!address.isDefault) {
      await Address.updateMany(
        { userId, _id: { $ne: address._id }, isDefault: true },
        { $set: { isDefault: false } }
      );

      address.isDefault = true;
      await address.save();
    }

    return sendSuccess(res, 200, 'Default address updated successfully', address);
  } catch (error) {
    return handleControllerError(res, error);
  }
};
