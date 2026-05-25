const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((sanitized, [key, entryValue]) => {
      // Prevent query selector injection through user-controlled keys.
      if (key.startsWith('$') || key.includes('.')) {
        return sanitized;
      }

      sanitized[key] = sanitizeValue(entryValue);
      return sanitized;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

module.exports = sanitizeRequest;
