module.exports = (schema, property = 'body') => (req, res, next) => {
  const source = property === 'query' ? req.query : req.body;
  const { error, value } = schema.validate(source, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map((d) => d.context?.message || d.message).join('; '),
    });
  }
  if (property === 'query') {
    req.validatedQuery = value;
  } else {
    Object.assign(req.body, value);
  }
  next();
};
