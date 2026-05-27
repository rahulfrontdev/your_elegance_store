const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/Product");

const cartOwnerFilter = (userId) => ({
  $or: [{ user: userId }, { userId }]
});

const ownerId = (user) => user?._id ?? user?.id;

/** Older carts may only have `userId`; schema requires `user` — fix before save. */
function ensureCartOwner(cart, user) {
  const uid = ownerId(user);
  if (!uid || !cart) return;
  if (!cart.user) cart.user = uid;
  if (!cart.userId) cart.userId = uid;
}

/** After populate, missing products become null; drop those lines and persist. */
async function pruneMissingProducts(cart, user) {
  ensureCartOwner(cart, user);
  const before = cart.items.length;
  cart.items = cart.items.filter((item) => item.productId);
  if (cart.items.length !== before) {
    await cart.save();
  }
  return cart;
}

function buildCartSummary(cart) {
  let grandTotal = 0;
  let totalQuantity = 0;

  const items = (cart?.items || []).map(item => {
    const unitPrice = item.productId.price;
    const subtotal = item.quantity * unitPrice;
    grandTotal += subtotal;
    totalQuantity += item.quantity;

    return {
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      imageUrl: item.productId.imageUrl || "",
      images: item.productId.images || [],
      quantity: item.quantity,
      subtotal
    };
  });

  return { items, totalQuantity, grandTotal };
}

// Add To Cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    let cart = await Cart.findOne(cartOwnerFilter(userId));

    if (!cart) {
      cart = new Cart({
        user: userId,
        userId,
        items: []
      });
    }

    const index = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (index > -1) {
      cart.items[index].quantity += quantity || 1;
    } else {
      cart.items.push({
        productId,
        quantity: quantity || 1
      });
    }

    ensureCartOwner(cart, req.user);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne(cartOwnerFilter(userId))
      .populate("items.productId");

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: [],
        grandTotal: 0
      });
    }

    await pruneMissingProducts(cart, req.user);

    let grandTotal = 0;
    let totalQuantity = 0;

    const items = cart.items.map(item => {       // ← map, not forEach
      const unitPrice = item.productId.price;
      const subtotal = item.quantity * unitPrice;
      grandTotal += subtotal;
      totalQuantity += item.quantity;

      return {                                   // ← return is INSIDE map
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        imageUrl: item.productId.imageUrl || "",
        images: item.productId.images || [],
        quantity: item.quantity,
        subtotal                                 // ← now part of each item
      };
    });

    res.status(200).json({
      success: true,
      data: items,                               // ← send items not raw cart
      totalQuantity,
      grandTotal
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Merge guest/localStorage cart into logged-in user's server cart after login.
exports.mergeGuestCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const rawItems = req.body.items;

    if (!Array.isArray(rawItems)) {
      return res.status(400).json({
        success: false,
        message: "items must be an array"
      });
    }

    const normalizedItemsByProduct = new Map();

    for (const item of rawItems) {
      const productId = String(item.productId || item._id || item.id || "").trim();
      const quantity = Number.parseInt(String(item.quantity || 1), 10);

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid productId in cart items"
        });
      }

      if (Number.isNaN(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Cart item quantity must be at least 1"
        });
      }

      normalizedItemsByProduct.set(
        productId,
        (normalizedItemsByProduct.get(productId) || 0) + quantity
      );
    }

    let cart = await Cart.findOne(cartOwnerFilter(userId));

    if (!cart) {
      cart = new Cart({
        user: userId,
        userId,
        items: []
      });
    }

    const productIds = Array.from(normalizedItemsByProduct.keys());

    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }, { _id: 1 }).lean();
      const existingProductIds = new Set(products.map(product => String(product._id)));
      const missingProductId = productIds.find(productId => !existingProductIds.has(productId));

      if (missingProductId) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${missingProductId}`
        });
      }

      for (const [productId, quantity] of normalizedItemsByProduct.entries()) {
        const existingItem = cart.items.find(
          item => item.productId.toString() === productId
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.items.push({ productId, quantity });
        }
      }

      ensureCartOwner(cart, req.user);
      await cart.save();
    }

    const populatedCart = await Cart.findOne(cartOwnerFilter(userId)).populate("items.productId");
    if (populatedCart) {
      await pruneMissingProducts(populatedCart, req.user);
    }
    const { items, totalQuantity, grandTotal } = buildCartSummary(populatedCart);

    return res.status(200).json({
      success: true,
      message: "Guest cart merged successfully",
      data: items,
      totalQuantity,
      grandTotal
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Remove Item
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne(cartOwnerFilter(userId));

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    ensureCartOwner(cart, req.user);
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne(cartOwnerFilter(userId));

    if (!cart) {                                          // ← missing null check
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (!item) {                                          // ← missing null check
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    item.quantity = quantity;
    ensureCartOwner(cart, req.user);
    await cart.save();

    const updatedCart = await Cart.findOne(cartOwnerFilter(userId))
      .populate("items.productId");

    await pruneMissingProducts(updatedCart, req.user);

    let grandTotal = 0;
    let totalQuantity = 0;

    const items = updatedCart.items.map(item => {         // ← map like getCart
      const unitPrice = item.productId.price;
      const subtotal = item.quantity * unitPrice;
      grandTotal += subtotal;
      totalQuantity += item.quantity;

      return {
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        imageUrl: item.productId.imageUrl || "",
        images: item.productId.images || [],
        quantity: item.quantity,
        subtotal                                          // ← subtotal per item
      };
    });

    res.status(200).json({
      success: true,
      message: "Quantity updated",
      data: items,                                        // ← mapped items not raw cart
      totalQuantity,
      grandTotal
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await Cart.findOneAndUpdate(
      cartOwnerFilter(userId),
      { items: [] }
    );

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: [],
      grandTotal: 0
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};