const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware.js");

router.post("/add", protect, cartController.addToCart);
router.post("/merge", protect, cartController.mergeGuestCart);
router.get("/get", protect, cartController.getCart);
router.delete("/remove/:productId", protect, cartController.removeItem);
router.put("/update", protect, cartController.updateQuantity);
router.delete("/clear", protect, cartController.clearCart);

module.exports = router;