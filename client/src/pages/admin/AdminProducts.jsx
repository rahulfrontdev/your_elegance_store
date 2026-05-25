import React, { useEffect, useMemo, useState } from "react";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminFetchCategoryChildren,
  adminFetchProductById,
  adminFetchProductGstRates,
  adminFetchProducts,
  adminFetchRootCategories,
  adminUpdateProduct,
} from "../../api/adminApi";

function formatProductSaveError(error) {
  const d = error?.response?.data
  if (typeof d === "string" && d.trim()) return d.trim()
  if (typeof d?.message === "string" && d.message.trim()) return d.message.trim()
  if (typeof d?.error === "string" && d.error.trim()) return d.error.trim()
  if (Array.isArray(d?.errors)) {
    const parts = d.errors
      .map((e) => (typeof e === "string" ? e : e?.msg || e?.message))
      .filter(Boolean)
    if (parts.length) return parts.join("\n")
  }
  const st = error?.response?.status
  if (st === 401) return "Unauthorized (401). Log in again — admin JWT required for POST /products."
  if (st === 403) return "Forbidden (403). Your account must have role: admin."
  if (st === 404)
    return "Not found (404). Ensure VITE_API_BASE_URL is the API root with /api (e.g. http://localhost:8000/api)."
  if (error?.message === "Failed to fetch" || error?.name === "TypeError")
    return "Network error — is the API running? Check CORS and VITE_API_BASE_URL in .env."
  return error?.message || "Failed to save product. Please try again."
}

const initialFormState = {
  name: "",
  category: "",
  subcategory: "",
  colour: "",
  price: "",
  description: "",
  qty: "",
  gstRate: "",
  imageUrl: "",
  image: null,
  extraImages: [],
};

const MAX_EXTRA_IMAGES = 8;
const DEFAULT_GST_RATES = [3, 12, 18];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [gstRates, setGstRates] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");
  const [productForm, setProductForm] = useState(initialFormState);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [existingExtraImages, setExistingExtraImages] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadProducts(), loadRootCategories(), loadGstRates()]);
  };

  const loadProducts = async () => {
    try {
      const response = await adminFetchProducts();
      setProducts(response?.data?.data || response?.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const loadRootCategories = async () => {
    try {
      const response = await adminFetchRootCategories({ all: true });
      setCategories(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const loadGstRates = async () => {
    try {
      const response = await adminFetchProductGstRates();
      const raw =
        response?.data?.rates ??
        response?.data?.data?.rates ??
        (Array.isArray(response?.data) ? response.data : null);
      const rates = Array.isArray(raw) ? raw.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : [];
      setGstRates(rates.length ? rates : DEFAULT_GST_RATES);
    } catch (error) {
      console.error("Error fetching GST rates:", error);
      setGstRates(DEFAULT_GST_RATES);
    }
  };

  const loadSubcategories = async (categoryId, preselectedSubcategoryId = "") => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    try {
      setSubcategoriesLoading(true);
      const response = await adminFetchCategoryChildren(categoryId, { all: true });
      const list = response?.data?.data || [];
      setSubcategories(list);
      if (preselectedSubcategoryId) {
        setProductForm((prev) => ({ ...prev, subcategory: preselectedSubcategoryId }));
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const resetForm = () => {
    setProductForm(initialFormState);
    setSubcategories([]);
    setExistingImageUrl("");
    setExistingExtraImages([]);
    setEditingProductId("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = async (productId) => {
    try {
      const response = await adminFetchProductById(productId);
      const product = response?.data?.data || response?.data;
      if (!product) return;

      const categoryId = product?.category?._id || product?.category || "";
      const subcategoryId = product?.subcategory?._id || product?.subcategory || "";

      setEditingProductId(productId);
      setProductForm({
        name: product?.name || "",
        category: categoryId,
        subcategory: subcategoryId,
        colour: product?.colour || "",
        price: product?.price?.toString?.() || "",
        description: product?.description || "",
        qty: product?.qty?.toString?.() || "0",
        gstRate: product?.gstRate?.toString?.() || "",
        imageUrl: (() => {
          const u = product?.imageUrl || (typeof product?.image === "string" ? product.image : "");
          return typeof u === "string" ? u.trim() : "";
        })(),
        image: null,
        extraImages: [],
      });
      setExistingImageUrl(product?.imageUrl || product?.image || "");
      setExistingExtraImages(Array.isArray(product?.images) ? product.images : []);
      setIsModalOpen(true);

      if (categoryId) {
        await loadSubcategories(categoryId, subcategoryId);
      }
    } catch (error) {
      console.error("Error loading product details:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setProductForm((prev) => ({ ...prev, image: files?.[0] || null }));
      return;
    }
    if (name === "extraImages") {
      const arr = Array.from(files || []).slice(0, MAX_EXTRA_IMAGES);
      setProductForm((prev) => ({ ...prev, extraImages: arr }));
      return;
    }

    if (name === "category") {
      setProductForm((prev) => ({ ...prev, category: value, subcategory: "" }));
      loadSubcategories(value);
      return;
    }

    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!productForm.name?.trim() || !productForm.category) return false;

    const priceNum = Number(productForm.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      alert("Price must be a number ≥ 0.");
      return false;
    }

    const gstVal = Number(productForm.gstRate);
    const allowedGst = (gstRates.length ? gstRates : DEFAULT_GST_RATES).map((r) => Number(r));
    if (!productForm.gstRate || !allowedGst.includes(gstVal)) {
      alert(`GST rate must be one of: ${allowedGst.join(", ")}.`);
      return false;
    }

    const selectedCategoryExists = categories.some(
      (cat) => (cat?._id || cat?.id) === productForm.category
    );
    if (!selectedCategoryExists) {
      alert("Selected category is invalid. Please select category again.");
      return false;
    }

    if (productForm.subcategory?.trim()) {
      const selectedSubcategoryExists = subcategories.some(
        (sub) => (sub?._id || sub?.id) === productForm.subcategory
      );
      if (!selectedSubcategoryExists) {
        alert("Selected subcategory is invalid for this category. Please reselect or clear it.");
        return false;
      }
    }

    const allowedMime = /^image\/(jpeg|pjpeg|png|webp)$/i;
    const fileTypeOk = (f) => !f?.type || allowedMime.test(f.type);
    if (productForm.image && !fileTypeOk(productForm.image)) {
      alert("Main image must be jpeg, jpg, png, or webp.");
      return false;
    }
    const badExtra = productForm.extraImages?.find((f) => !fileTypeOk(f));
    if (badExtra) {
      alert("Extra images must be jpeg, jpg, png, or webp only.");
      return false;
    }

    return true;
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("name", productForm.name.trim());
    formData.append("category", String(productForm.category).trim());
    const sub = String(productForm.subcategory || "").trim();
    if (sub) {
      formData.append("subcategory", sub);
    }
    formData.append("colour", String(productForm.colour || "").trim());
    formData.append("price", String(productForm.price).trim());
    formData.append("description", String(productForm.description || "").trim());
    formData.append("qty", productForm.qty !== "" && productForm.qty != null ? String(productForm.qty) : "0");
    formData.append("gstRate", String(productForm.gstRate));

    if (productForm.image) {
      formData.append("image", productForm.image);
    } else {
      const url = String(productForm.imageUrl || "").trim();
      if (url) {
        formData.append("imageUrl", url);
      }
    }

    const extras = Array.isArray(productForm.extraImages) ? productForm.extraImages : [];
    extras.slice(0, MAX_EXTRA_IMAGES).forEach((file) => {
      formData.append("images", file);
    });

    return formData;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields correctly.");
      return;
    }

    try {
      setSaving(true);
      const formData = buildFormData();

      if (editingProductId) {
        await adminUpdateProduct(editingProductId, formData);
      } else {
        await adminCreateProduct(formData);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(formatProductSaveError(error));
      return;
    } finally {
      setSaving(false);
    }

    try {
      await loadProducts();
    } catch (e) {
      console.error("Error refreshing product list:", e);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Delete product "${name}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await adminDeleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setDeletingId("");
    }
  };

  const displayProducts = useMemo(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-black to-gray-700 text-white px-4 py-2 rounded-lg text-sm shadow-md hover:scale-105 transition"
        >
          + Create Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Products</h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
            {displayProducts.length} total
          </span>
        </div>

        {displayProducts.length === 0 ? (
          <p className="text-gray-500 text-sm">No products found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProducts.map((item) => {
              const id = item?._id || item?.id;
              const categoryName = item?.category?.name || "N/A";
              const subcategoryName = item?.subcategory?.name || "N/A";
              return (
                <div key={id} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="w-full h-44 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-3">
                    {item?.imageUrl || item?.image ? (
                      <img
                        src={item?.imageUrl || item?.image}
                        alt={item?.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">No Image</span>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-gray-800 truncate">{item?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Category: {categoryName}</p>
                    <p className="text-xs text-gray-500">Subcategory: {subcategoryName}</p>
                    <p className="text-xs text-gray-500">GST: {item?.gstRate}%</p>
                    <p className="text-sm font-semibold mt-1">Rs. {item?.price}</p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditModal(id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(id, item?.name)}
                      disabled={deletingId === id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingProductId ? "Edit Product" : "Create Product"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="name"
                value={productForm.name}
                onChange={handleChange}
                placeholder="Name *"
                className="border border-gray-300 p-2 rounded-lg outline-none"
              />
              <input
                name="colour"
                value={productForm.colour}
                onChange={handleChange}
                placeholder="Colour"
                className="border border-gray-300 p-2 rounded-lg outline-none"
              />
              <select
                name="category"
                value={productForm.category}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-lg outline-none"
              >
                <option value="">Select Category *</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                name="subcategory"
                value={productForm.subcategory}
                onChange={handleChange}
                disabled={!productForm.category || subcategoriesLoading}
                className="border border-gray-300 p-2 rounded-lg outline-none disabled:bg-gray-100"
              >
                <option value="">
                  {subcategoriesLoading
                    ? "Loading..."
                    : subcategories.length > 0
                      ? "Subcategory (optional)"
                      : "No subcategories"}
                </option>
                {subcategories.map((sub) => (
                  <option key={sub._id || sub.id} value={sub._id || sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleChange}
                placeholder="Price *"
                className="border border-gray-300 p-2 rounded-lg outline-none"
              />
              <input
                type="number"
                name="qty"
                value={productForm.qty}
                onChange={handleChange}
                placeholder="Quantity"
                className="border border-gray-300 p-2 rounded-lg outline-none"
              />
              <select
                name="gstRate"
                value={productForm.gstRate}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-lg outline-none"
              >
                <option value="">Select GST Rate *</option>
                {gstRates.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Description"
                  className="w-full border border-gray-300 p-2 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-gray-500 text-sm">Main image file (max 1) — jpeg, jpg, png, webp</span>
                  <input
                    type="file"
                    name="image"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
                {existingImageUrl && !productForm.image && (
                  <p className="text-xs text-gray-500 mt-1">Using current image</p>
                )}
                {productForm.image && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Main image selected: {productForm.image.name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-gray-500 text-sm">Extra images (up to {MAX_EXTRA_IMAGES}) — same types</span>
                  <input
                    type="file"
                    name="extraImages"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
                {existingExtraImages.length > 0 && productForm.extraImages.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Existing extra images: {existingExtraImages.length}
                  </p>
                )}
                {productForm.extraImages.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {productForm.extraImages.length} extra image(s) selected
                    {productForm.extraImages.length > MAX_EXTRA_IMAGES
                      ? ` — only the first ${MAX_EXTRA_IMAGES} will be sent.`
                      : "."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {saving ? "Saving..." : editingProductId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts