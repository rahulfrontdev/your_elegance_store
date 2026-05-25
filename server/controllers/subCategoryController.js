// controllers/subCategoryController.js
const mongoose = require('mongoose');
const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');
const Product = require('../models/Product');
const slugify = require('slugify');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ Create SubCategory
exports.createSubCategory = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Name and categoryId are required' });
    }
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const parent = await Category.findById(categoryId);
    if (!parent) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const sub = await SubCategory.create({
      name,
      description,
      slug: slugify(name, { lower: true, strict: true }),
      category: categoryId,
    });

    res.json({
      message: 'Subcategory created successfully',
      subcategory: sub,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All SubCategories
exports.getSubCategories = async (req, res) => {
  try {
    const subs = await SubCategory.find().populate('category', 'name slug');
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get SubCategory by Category
exports.getSubByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const subs = await SubCategory.find({ category: categoryId });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Single SubCategory
exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = isValidObjectId(id) ? { _id: id } : { slug: id };
    const sub = await SubCategory.findOne(query).populate('category', 'name slug description');

    if (!sub) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update SubCategory
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid subcategory id' });
    }

    const existing = await SubCategory.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    const updateFields = {};

    if (name) {
      updateFields.name = name;
      updateFields.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) {
      updateFields.description = description;
    }
    if (categoryId !== undefined) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid category id' });
      }
      const parent = await Category.findById(categoryId);
      if (!parent) {
        return res.status(404).json({ message: 'Category not found' });
      }
      updateFields.category = categoryId;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    const updatedData = await SubCategory.findByIdAndUpdate(id, updateFields, { new: true });

    res.json({
      message: 'Subcategory updated successfully',
      updatedData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete SubCategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid subcategory id' });
    }

    const used = await Product.countDocuments({ subcategory: id });
    if (used > 0) {
      return res.status(400).json({
        message: 'Cannot delete: products are using this subcategory',
      });
    }

    const deletedData = await SubCategory.findByIdAndDelete(id);
    if (!deletedData) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.json({
      message: 'Subcategory deleted successfully',
      deletedData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
