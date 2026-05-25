const success = (res, status, message, data = null) => {
  res.status(status).json({ success: true, message, data });
};

const fail = (res, status, message) => {
  res.status(status).json({ success: false, message });
};
module.exports = { success, fail };