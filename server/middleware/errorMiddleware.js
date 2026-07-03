const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err?.name === 'MulterError') {
    const fieldHint = err.field ? ` (field: ${err.field})` : '';
    const friendly =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum upload size is 20 MB.'
        : err.message || 'Upload failed';
    return res.status(400).json({
      success: false,
      message: `${friendly}${fieldHint}`,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode)
      ? err.statusCode
      : res.statusCode && res.statusCode !== 200
        ? res.statusCode
        : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };

