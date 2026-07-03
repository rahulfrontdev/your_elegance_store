/**
 * Seed active product discounts so the home page "Best deals" section has items.
 * Usage: cd server && node scripts/seedBestDeals.js
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const { enrichProductsWithCampaignPricing } = require('../services/pricingEngine');

const DEALS = [
  {
    discountName: 'Pearl Earrings Best Deal',
    discountType: 'percentage',
    discountValue: 25,
    applicableOn: 'product',
    productSku: 'DEMO-001',
    priority: 10,
    description: 'Limited time best deal on gold plated pearl earrings',
  },
  {
    discountName: 'Bag Festive Offer',
    discountType: 'percentage',
    discountValue: 15,
    applicableOn: 'product',
    productNameMatch: 'Bag',
    priority: 5,
    description: 'Best deal on premium bags',
  },
];

async function main() {
  await connectDB();

  const startDate = new Date('2026-01-01T00:00:00.000Z');
  const endDate = new Date('2027-12-31T23:59:59.999Z');
  const created = [];

  for (const deal of DEALS) {
    let product = null;
    if (deal.productSku) {
      product = await Product.findOne({ sku: deal.productSku });
    }
    if (!product && deal.productNameMatch) {
      product = await Product.findOne({ name: new RegExp(deal.productNameMatch, 'i') });
    }
    if (!product) {
      console.warn(`Skipping "${deal.discountName}" — product not found`);
      continue;
    }

    const existing = await Discount.findOne({
      discountName: deal.discountName,
      applicableOn: 'product',
      productIds: product._id,
    });

    if (existing) {
      if (existing.status !== 'active') {
        existing.status = 'active';
        existing.startDate = startDate;
        existing.endDate = endDate;
        await existing.save();
        console.log(`Reactivated discount: ${existing.discountName}`);
      } else {
        console.log(`Already exists: ${existing.discountName}`);
      }
      created.push({ product: product.name, discount: existing.discountName });
      continue;
    }

    // Fix legacy empty discountCode that breaks sparse unique index
    await Discount.updateMany({ discountCode: '' }, { $unset: { discountCode: '' } });

    const doc = await Discount.create({
      discountName: deal.discountName,
      discountType: deal.discountType,
      discountValue: deal.discountValue,
      startDate,
      endDate,
      applicableOn: 'product',
      productIds: [product._id],
      status: 'active',
      priority: deal.priority,
      description: deal.description,
      minimumOrderAmount: 0,
    });

    console.log(`Created: ${doc.discountName} on "${product.name}" (${deal.discountValue}% off)`);
    created.push({ product: product.name, discount: doc.discountName });
  }

  const products = await Product.find().lean();
  const withPricing = await enrichProductsWithCampaignPricing(products);
  const bestDeals = withPricing
    .filter((p) => p.hasActiveDiscount)
    .sort((a, b) => b.discountPercentage - a.discountPercentage);

  console.log('\nBest deals now available:');
  bestDeals.forEach((p) => {
    console.log(
      `  • ${p.name}: ₹${p.originalPrice} → ₹${p.discountedPrice} (${p.discountPercentage}% off)`
    );
  });
  console.log(`\nTotal: ${bestDeals.length} product(s) with active discounts`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
