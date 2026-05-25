const Category = require('../models/Category');
const Catalog = require('../models/Catalog');

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * All category _ids under a root (including root), using Category.path prefix.
 */
async function getDescendantCategoryIds(categoryId) {
  if (!categoryId) return new Set();
  const selected = await Category.findById(categoryId).lean();
  if (!selected) return new Set();
  const rows = await Category.find({
    $or: [{ _id: selected._id }, { path: { $regex: `^${escapeRegex(selected.path)},` } }],
  })
    .select('_id')
    .lean();
  return new Set(rows.map((r) => String(r._id)));
}

/**
 * Union of all category trees referenced by a catalog document.
 */
async function expandCatalogToCategoryIdSet(catalogId) {
  const catalog = await Catalog.findById(catalogId).lean();
  if (!catalog || !Array.isArray(catalog.categoryIds) || catalog.categoryIds.length === 0) {
    return new Set();
  }
  const union = new Set();
  for (const cid of catalog.categoryIds) {
    const subset = await getDescendantCategoryIds(cid);
    subset.forEach((id) => union.add(id));
  }
  return union;
}

module.exports = {
  escapeRegex,
  getDescendantCategoryIds,
  expandCatalogToCategoryIdSet,
};
