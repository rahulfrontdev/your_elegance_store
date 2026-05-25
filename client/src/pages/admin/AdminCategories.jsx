import React, { useEffect, useState } from "react";
import {
  adminCreateCategoryUpload,
  adminDeleteCategory,
  adminDisableCategoryTree,
  adminEnableCategoryTree,
  adminFetchCategoryChildren,
  adminFetchCategoryTree,
  adminFetchRootCategories,
  adminUpdateCategory,
} from "../../api/adminApi";

const AdminCategories = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState({
    name: "",
    parent: "",
    description: "",
    image: null,
  });
  const [categories, setCategories] = useState([]);
  const [deletingId, setDeletingId] = useState("");
  const [parentOptions, setParentOptions] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [childrenByParentId, setChildrenByParentId] = useState({});
  const [loadingChildrenByParentId, setLoadingChildrenByParentId] = useState({});
  const [statusAction, setStatusAction] = useState({ id: "", type: "" });
  const [editingCategoryId, setEditingCategoryId] = useState("");

  useEffect(() => {
    fetchAllCategories();
    fetchRootCategories();
  }, []);

  const flattenCategoryTree = (nodes, level = 0) => {
    if (!Array.isArray(nodes)) return [];

    return nodes.flatMap((node) => {
      const nodeId = node?._id || node?.id;
      const nodeName = node?.name || "Unnamed";
      const children = node?.children || node?.subcategories || [];

      const currentNode = nodeId
        ? [{ id: nodeId, label: `${"— ".repeat(level)}${nodeName}` }]
        : [];
      return [...currentNode, ...flattenCategoryTree(children, level + 1)];
    });
  };

  const fetchAllCategories = async () => {
    try {
      const response = await adminFetchCategoryTree({ all: true });
      const treeData = response?.data?.data || [];
      setParentOptions(flattenCategoryTree(treeData));
    } catch (err) {
      console.error(err);
      setParentOptions([]);
    }
  };

  const fetchRootCategories = async () => {
    try {
      const response = await adminFetchRootCategories({ all: true });
      setCategories(response?.data?.data || []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  const getCategoryId = (item) => item?._id || item?.id;
  const isCategoryEnabled = (item) => {
    if (typeof item?.status === "boolean") return item.status;
    if (typeof item?.isActive === "boolean") return item.isActive;
    if (typeof item?.enabled === "boolean") return item.enabled;
    if (typeof item?.status === "string") {
      const value = item.status.toLowerCase();
      return value === "active" || value === "enabled" || value === "true";
    }
    return true;
  };

  const loadChildCategories = async (parentId) => {
    if (!parentId) return [];
    setLoadingChildrenByParentId((prev) => ({ ...prev, [parentId]: true }));
    try {
      const response = await adminFetchCategoryChildren(parentId, { all: true });
      const children = response?.data?.data || [];
      setChildrenByParentId((prev) => ({ ...prev, [parentId]: children }));
      return children;
    } catch (error) {
      console.error("Error loading child categories:", error);
      setChildrenByParentId((prev) => ({ ...prev, [parentId]: [] }));
      return [];
    } finally {
      setLoadingChildrenByParentId((prev) => ({ ...prev, [parentId]: false }));
    }
  };

  const handleToggleExpand = async (cat) => {
    const categoryId = getCategoryId(cat);
    if (!categoryId) return;

    const isExpanded = !!expandedNodes[categoryId];
    if (isExpanded) {
      setExpandedNodes((prev) => ({ ...prev, [categoryId]: false }));
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(childrenByParentId, categoryId)) {
      await loadChildCategories(categoryId);
    }
    setExpandedNodes((prev) => ({ ...prev, [categoryId]: true }));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setCategory({ ...category, image: files[0] });
      return;
    }
    setCategory({ ...category, [name]: value });
  };

  const resetCategoryForm = () => {
    setCategory({
      name: "",
      parent: "",
      description: "",
      image: null,
    });
    setEditingCategoryId("");
  };

  const getParentId = (item) => {
    const parent = item?.parent || item?.parentId;
    if (!parent) return "";
    if (typeof parent === "string") return parent;
    if (typeof parent === "object") return parent?._id || parent?.id || "";
    return "";
  };

  const openCreateModal = () => {
    resetCategoryForm();
    setIsOpen(true);
  };

  const openEditModal = (item) => {
    const categoryId = getCategoryId(item);
    if (!categoryId) return;

    setEditingCategoryId(categoryId);
    setCategory({
      name: item?.name || "",
      parent: getParentId(item),
      description: item?.description || "",
      image: null,
    });
    setIsOpen(true);
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!categoryId) return;
    const isConfirmed = window.confirm(
      `Delete "${categoryName}" and all its child categories?`
    );
    if (!isConfirmed) return;

    try {
      setDeletingId(categoryId);
      await adminDeleteCategory(categoryId);
      await fetchAllCategories();
      await fetchRootCategories();
      setExpandedNodes({});
      setChildrenByParentId({});
      setLoadingChildrenByParentId({});
    } catch (error) {
      console.error("Error deleting category tree:", error);
    } finally {
      setDeletingId("");
    }
  };

  const refreshCategoryData = async () => {
    await fetchAllCategories();
    await fetchRootCategories();
    setExpandedNodes({});
    setChildrenByParentId({});
    setLoadingChildrenByParentId({});
  };

  const handleEnableTree = async (categoryId) => {
    if (!categoryId) return;
    try {
      setStatusAction({ id: categoryId, type: "enable" });
      await adminEnableCategoryTree(categoryId);
      await refreshCategoryData();
    } catch (error) {
      console.error("Error enabling category tree:", error);
    } finally {
      setStatusAction({ id: "", type: "" });
    }
  };

  const handleDisableTree = async (categoryId) => {
    if (!categoryId) return;
    try {
      setStatusAction({ id: categoryId, type: "disable" });
      await adminDisableCategoryTree(categoryId);
      await refreshCategoryData();
    } catch (error) {
      console.error("Error disabling category tree:", error);
    } finally {
      setStatusAction({ id: "", type: "" });
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", category.name);
      formData.append("description", category.description);

      if (category.parent) {
        formData.append("parentId", category.parent);
        formData.append("parent", category.parent);
      }

      if (category.image) {
        formData.append("image", category.image);
      }

      if (editingCategoryId) {
        await adminUpdateCategory(editingCategoryId, formData);
      } else {
        await adminCreateCategoryUpload(formData);
      }

      setIsOpen(false);
      resetCategoryForm();
      await refreshCategoryData();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const renderCategoryNode = (cat, level = 0, parentLabel = "Main Category") => {
    const categoryId = getCategoryId(cat);
    if (!categoryId) return null;

    const isExpanded = !!expandedNodes[categoryId];
    const isLoadingChildren = !!loadingChildrenByParentId[categoryId];
    const children = childrenByParentId[categoryId] || [];
    const imageHeightClass = level === 0 ? "h-44" : "h-36";
    const nestedOffset = Math.min(level * 16, 80);
    const enabled = isCategoryEnabled(cat);
    const isEnableLoading =
      statusAction.id === categoryId && statusAction.type === "enable";
    const isDisableLoading =
      statusAction.id === categoryId && statusAction.type === "disable";
    const isAnyStatusActionLoading =
      statusAction.id === categoryId && statusAction.type !== "";

    return (
      <div key={`${categoryId}-${level}`} className="space-y-2">
        <div
          onClick={() => handleToggleExpand(cat)}
          className="group bg-white border border-gray-200 rounded-xl p-3 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          style={{ marginLeft: `${nestedOffset}px` }}
        >
          <div className={`w-full ${imageHeightClass} rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-3`}>
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs font-semibold text-gray-400">No Image</span>
            )}
          </div>

          <div className="min-w-0 flex-1 mt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Parent: {parentLabel}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
                  {isExpanded ? "Hide" : "Show"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(cat);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(categoryId, cat.name);
                  }}
                  disabled={deletingId === categoryId}
                  className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  {deletingId === categoryId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            {cat.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
            )}
            <div
              className="flex flex-wrap gap-2 mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleEnableTree(categoryId)}
                disabled={isAnyStatusActionLoading || enabled}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition ${enabled
                  ? "bg-gray-200 text-gray-500 blur-[0.5px] cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                  } disabled:opacity-70`}
              >
                {isEnableLoading
                  ? "Enabling..."
                  : "Enable tree"}
              </button>
              <button
                type="button"
                onClick={() => handleDisableTree(categoryId)}
                disabled={isAnyStatusActionLoading || !enabled}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition ${enabled
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-gray-200 text-gray-500 blur-[0.5px] cursor-not-allowed"
                  } disabled:opacity-70`}
              >
                {isDisableLoading
                  ? "Disabling..."
                  : "Disable tree"}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            {isLoadingChildren ? (
              <p className="text-xs text-gray-500" style={{ marginLeft: `${Math.min((level + 1) * 16, 96)}px` }}>
                Loading child categories...
              </p>
            ) : children.length === 0 ? (
              <p className="text-xs text-gray-500" style={{ marginLeft: `${Math.min((level + 1) * 16, 96)}px` }}>
                No child categories
              </p>
            ) : (
              children.map((child) => renderCategoryNode(child, level + 1, cat.name))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-black to-gray-700 text-white px-4 py-2 rounded-lg text-sm shadow-md hover:scale-105 transition"
        >
          + Create Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Main Categories</h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
            {categories.length} total
          </span>
        </div>

        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No categories found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories?.map((cat) => renderCategoryNode(cat))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all scale-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingCategoryId ? "Edit Category" : "Create Category"}
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetCategoryForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Category Name</label>
                <input
                  type="text"
                  name="name"
                  value={category.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Parent Category</label>
                <select
                  name="parent"
                  value={category.parent}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none"
                >
                  <option value="">None (Main Category)</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <textarea
                  name="description"
                  value={category.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Write something..."
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Category Image</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-gray-500 text-sm">Click to upload or drag & drop</span>
                  <input
                    type="file"
                    name="image"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetCategoryForm();
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-black text-white px-4 py-2 rounded-lg"
                >
                  {editingCategoryId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default AdminCategories;