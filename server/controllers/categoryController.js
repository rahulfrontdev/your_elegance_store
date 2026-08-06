// controllers/categoryController.js

const Category = require("../models/Category");
const slugify = require("slugify");
const { uploadOptimizedImage } = require("../utils/imageOptimizer");
const multer = require("../middleware/multer/multer");

/* -------------------- Helpers -------------------- */

const success = (res, status, message, data = null) => {
  res.status(status).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, status, message) => {
  res.status(status).json({
    success: false,
    message,
  });
};

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const buildSlug = (name) =>
  slugify(name, { lower: true, strict: true, trim: true });

const escapeRegex = (text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canViewInactive = (req) =>
  req.query.all === "true" && req.user && req.user.role === "admin";

/* -------------------- CREATE -------------------- */
// Create category at any depth
exports.createCategory = async (req, res) => {
  try {
    let { name, description, parentId } = req.body;

    if (!name || !name.trim()) {
      return fail(res, 400, "Category name is required");
    }

    name = name.trim();

    if (name.length < 2 || name.length > 80) {
      return fail(res, 400, "Name must be between 2 and 80 characters");
    }

    if (description && description.length > 500) {
      return fail(res, 400, "Description max length is 500 characters");
    }

    if (parentId && !isValidObjectId(parentId)) {
      return fail(res, 400, "Invalid parentId");
    }

    const slug = buildSlug(name);

    const existing = await Category.findOne({
      $or: [{ name: new RegExp(`^${escapeRegex(name)}$`, "i") }, { slug }],
    });

    if (existing) {
      return fail(res, 409, "Category already exists");
    }

    let path = slug;
    let level = 0;

    if (parentId) {
      const parent = await Category.findById(parentId);

      if (!parent) {
        return fail(res, 404, "Parent category not found");
      }

      path = `${parent.path},${slug}`;
      level = parent.level + 1;

      if (level > 5) {
        return fail(res, 400, "Maximum depth level reached");
      }
    }

    // image upload
    let image = "";

    if (req.file) {
      const savedUrl = await uploadOptimizedImage(req.file, "categories", "category");
      if (typeof savedUrl === "object" && savedUrl?.error) {
        return fail(res, 400, savedUrl.error);
      }
      if (!savedUrl) {
        return fail(res, 400, "Failed to save category image");
      }
      image = savedUrl;
    }

    const category = await Category.create({
      name,
      slug,
      description: description?.trim() || "",
      image,
      parentId: parentId || null,
      path,
      level,
    });

    return success(res, 201, "Category created successfully", category);

  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/* -------------------- READ -------------------- */

// Get root categories only
exports.getRootCategories = async (req, res) => {
  try {
    const includeInactive = canViewInactive(req);

    const filter = {
      level: 0,
      ...(includeInactive ? {} : { isActive: true }),
    };

    const categories = await Category
      .find(filter)
      .sort({ createdAt: -1 })
      .lean(); // ✅ better performance

    return success(res, 200, "Root categories fetched", categories);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};
// Get single category
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const includeInactive = canViewInactive(req);

    if (!isValidObjectId(id)) {
      return fail(res, 400, "Invalid category id");
    }

    const category = await Category.findById(id).populate(
      "parentId",
      "name slug level"
    );

    if (!category) {
      return fail(res, 404, "Category not found");
    }

    if (!includeInactive && category.isActive === false) {
      return fail(res, 404, "Category not found");
    }

    return success(res, 200, "Category fetched", category);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

// Get direct children
exports.getChildCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const includeInactive = canViewInactive(req);

    if (!isValidObjectId(id)) {
      return fail(res, 400, "Invalid category id");
    }

    const children = await Category.find({
      parentId: id,
      ...(includeInactive ? {} : { isActive: true }),
    })
      .sort({ createdAt: -1 })
      .lean();

    return success(res, 200, "Child categories fetched", children);

  } catch (error) {
    return fail(res, 500, error.message);
  }
};
// Get descendants
exports.getDescendantCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const includeInactive = canViewInactive(req);

    if (!isValidObjectId(id)) {
      return fail(res, 400, "Invalid category id");
    }

    const parent = await Category.findById(id).lean();

    if (!parent) {
      return fail(res, 404, "Category not found");
    }

    if (!includeInactive && parent.isActive === false) {
      return fail(res, 404, "Category not found");
    }

    const descendants = await Category.find({
      path: { $regex: `^${escapeRegex(parent.path)},` },
      ...(includeInactive ? {} : { isActive: true }),
    })
      .sort({ level: 1, createdAt: -1 })
      .lean();

    return success(res, 200, "Descendants fetched", descendants);

  } catch (error) {
    return fail(res, 500, error.message);
  }
};
// Get full tree
exports.getCategoryTree = async (req, res) => {
  try {
    const filter = canViewInactive(req) ? {} : { isActive: true };

    const categories = await Category.find(filter).sort({
      level: 1,
      createdAt: -1,
    });

    const map = {};
    const tree = [];

    categories.forEach((cat) => {
      map[cat._id] = { ...cat.toObject(), children: [] };
    });

    categories.forEach((cat) => {
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat._id]);
      } else {
        tree.push(map[cat._id]);
      }
    });

    return success(res, 200, "Category tree fetched", tree);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/* -------------------- UPDATE -------------------- */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description } = req.body;

    if (!isValidObjectId(id)) {
      return fail(res, 400, "Invalid category id");
    }

    const updateData = {};

    if (name) {
      name = name.trim();

      if (name.length < 2 || name.length > 80) {
        return fail(res, 400, "Name must be between 2 and 80 characters");
      }

      updateData.name = name;
      updateData.slug = buildSlug(name);
    }

    if (description !== undefined) {
      if (description.length > 500) {
        return fail(res, 400, "Description max length is 500");
      }

      updateData.description = description.trim();
    }

    if (req.file) {
      const savedUrl = await uploadOptimizedImage(req.file, "categories", "category");
      if (typeof savedUrl === "object" && savedUrl?.error) {
        return fail(res, 400, savedUrl.error);
      }
      if (!savedUrl) {
        return fail(res, 400, "Failed to save category image");
      }
      updateData.image = savedUrl;
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return fail(res, 404, "Category not found");
    }

    return success(res, 200, "Category updated", updated);

  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/* -------------------- STATUS -------------------- */

exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return fail(res, 404, "Category not found");
    }

    category.isActive = !category.isActive;
    await category.save();

    return success(
      res,
      200,
      `Category ${category.isActive ? "enabled" : "disabled"}`,
      category
    );
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

exports.enableCategoryTree = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return fail(res, 404, "Category not found");
    }

    await Category.updateMany(
      {
        $or: [
          { _id: category._id },
          { path: { $regex: `^${escapeRegex(category.path)},` } },
        ],
      },
      { isActive: true }
    );

    return success(res, 200, "Category and descendants enabled");
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

exports.disableCategoryTree = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return fail(res, 404, "Category not found");
    }

    await Category.updateMany(
      {
        $or: [
          { _id: category._id },
          { path: { $regex: `^${escapeRegex(category.path)},` } },
        ],
      },
      { isActive: false }
    );

    return success(res, 200, "Category and descendants disabled");
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/* -------------------- DELETE -------------------- */

exports.deleteCategoryTree = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return fail(res, 400, "Invalid category id");
    }

    const category = await Category.findById(id);

    if (!category) {
      return fail(res, 404, "Category not found");
    }

    await Category.deleteMany({
      $or: [
        { _id: category._id },
        { path: { $regex: `^${escapeRegex(category.path)},` } },
      ],
    });

    return success(res, 200, "Category and descendants deleted");
  } catch (error) {
    return fail(res, 500, error.message);
  }
};