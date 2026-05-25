const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/categoryController");
const upload = require("../middleware/multer/multer");
const { optionalProtect } = require("../middleware/authMiddleware");

/* ---------------- CREATE ---------------- */
router.post(
  "/create",
  upload.single("image"),
  ctrl.createCategory
);

/* ---------------- READ ---------------- */
router.get("/getRoot", optionalProtect, ctrl.getRootCategories);
router.get("/tree", optionalProtect, ctrl.getCategoryTree);
router.get("/:id", optionalProtect, ctrl.getCategoryById);
router.get("/:id/children", optionalProtect, ctrl.getChildCategories);
router.get("/:id/descendants", optionalProtect, ctrl.getDescendantCategories);

/* ---------------- UPDATE ---------------- */
router.put("/:id", upload.single("image"), ctrl.updateCategory);

/* ---------------- STATUS ---------------- */
router.patch("/:id/toggle-status", ctrl.toggleCategoryStatus);
router.patch("/:id/enable-tree", ctrl.enableCategoryTree);
router.patch("/:id/disable-tree", ctrl.disableCategoryTree);

/* ---------------- DELETE ---------------- */
router.delete("/:id", ctrl.deleteCategoryTree);

module.exports = router;