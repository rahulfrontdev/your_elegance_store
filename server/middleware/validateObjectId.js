const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, `Invalid ${paramName}`);
  }

  return next();
};

module.exports = validateObjectId;
