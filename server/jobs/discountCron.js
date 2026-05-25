const cron = require('node-cron');
const Discount = require('../models/Discount');

let started = false;

function startDiscountJobs() {
  if (started) return;
  started = true;

  cron.schedule('*/5 * * * *', async () => {
    const now = new Date();
    try {
      await Discount.updateMany(
        { endDate: { $lt: now }, status: { $in: ['active', 'scheduled'] } },
        { $set: { status: 'expired' } }
      );
      await Discount.updateMany(
        {
          startDate: { $lte: now },
          endDate: { $gte: now },
          status: 'scheduled',
        },
        { $set: { status: 'active' } }
      );
    } catch (e) {
      console.error('Discount cron error:', e.message);
    }
  });
}

module.exports = { startDiscountJobs };
