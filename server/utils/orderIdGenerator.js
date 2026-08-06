const OrderSequence = require('../models/OrderSequence');

const IST_TIMEZONE = 'Asia/Kolkata';
const ORDER_PREFIX = 'YES';

/** YYYYMMDD in IST — daily sequence resets when this key changes at midnight IST. */
function getISTDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  return `${year}${month}${day}`;
}

function formatSequence(seq) {
  if (seq <= 9999) return String(seq).padStart(4, '0');
  return String(seq);
}

/**
 * YES + YYYYMMDD (IST) + daily sequence (0001, 0002, … resets at 12:00 AM IST).
 * Example: YES202608060001, YES202608060123
 */
async function generateOrderId(date = new Date()) {
  const dateKey = getISTDateKey(date);

  const counter = await OrderSequence.findOneAndUpdate(
    { dateKey },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seq = Number(counter?.seq || 1);
  return `${ORDER_PREFIX}${dateKey}${formatSequence(seq)}`;
}

module.exports = {
  ORDER_PREFIX,
  getISTDateKey,
  generateOrderId,
};
