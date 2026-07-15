import React, { useEffect, useMemo, useState } from "react";
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
import UploadProgressBar from "../../components/admin/UploadProgressBar";
import { resolveMediaUrl } from "../../utils/mediaUrl";

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
  const [childrenByParentId, setChildrenByParentId] = useState({});
  const [loadingChildrenByParentId, setLoadingChildrenByParentId] = useState({});
  const [statusAction, setStatusAction] = useState({ id: "", type: "" });
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  /** Breadcrumb trail: [{ id, name }, ...] from root → current folder */
  const [browsePath, setBrowsePath] = useState([]);

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

  const currentParent = browsePath.length ? browsePath[browsePath.length - 1] : null;
  const currentParentId = currentParent?.id || "";

  const visibleCategories = useMemo(() => {
    if (!currentParentId) return categories;
    return childrenByParentId[currentParentId] || [];
  }, [categories, childrenByParentId, currentParentId]);

  const isLoadingCurrentLevel = Boolean(
    currentParentId && loadingChildrenByParentId[currentParentId]
  );

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

  const openCategoryFolder = async (cat) => {
    const categoryId = getCategoryId(cat);
    if (!categoryId) return;
    if (!Object.prototype.hasOwnProperty.call(childrenByParentId, categoryId)) {
      await loadChildCategories(categoryId);
    }
    setBrowsePath((prev) => [...prev, { id: categoryId, name: cat.name || "Category" }]);
  };

  const goToBreadcrumb = async (index) => {
    if (index < 0) {
      setBrowsePath([]);
      return;
    }
    const nextPath = browsePath.slice(0, index + 1);
    const target = nextPath[nextPath.length - 1];
    if (target?.id && !Object.prototype.hasOwnProperty.call(childrenByParentId, target.id)) {
      await loadChildCategories(target.id);
    }
    setBrowsePath(nextPath);
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
      parent: currentParentId || "",
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
    setEditingCategoryId("");
    setCategory({
      name: "",
      parent: currentParentId || "",
      description: "",
      image: null,
    });
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
      setChildrenByParentId({});
      setLoadingChildrenByParentId({});
      const deletedInPath = browsePath.some((item) => item.id === categoryId);
      if (deletedInPath) setBrowsePath([]);
      else if (currentParentId) await loadChildCategories(currentParentId);
    } catch (error) {
      console.error("Error deleting category tree:", error);
    } finally {
      setDeletingId("");
    }
  };

  const refreshCategoryData = async () => {
    await fetchAllCategories();
    await fetchRootCategories();
    setChildrenByParentId({});
    setLoadingChildrenByParentId({});
    if (currentParentId) {
      await loadChildCategories(currentParentId);
    }
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
      setSaving(true);
      setUploadProgress(0);
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
        await adminCreateCategoryUpload(formData, { onProgress: setUploadProgress });
      }

      setIsOpen(false);
      resetCategoryForm();
      await refreshCategoryData();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const hierarchyLabel = useMemo(() => {
    if (!browsePath.length) return "All Categories";
    return ["All Categories", ...browsePath.map((item) => item.name)].join(" › ");
  }, [browsePath]);

  const renderCategoryCard = (cat) => {
    const categoryId = getCategoryId(cat);
    if (!categoryId) return null;

    const enabled = isCategoryEnabled(cat);
    const isEnableLoading =
      statusAction.id === categoryId && statusAction.type === "enable";
    const isDisableLoading =
      statusAction.id === categoryId && statusAction.type === "disable";
    const isAnyStatusActionLoading =
      statusAction.id === categoryId && statusAction.type !== "";
    const cardTrail = [
      ...browsePath.map((item) => item.name),
      cat.name || "Category",
    ];
    const imageSrc = resolveMediaUrl(cat.image || "");

    return (
      <div
        key={categoryId}
        className="group bg-white border border-gray-200 rounded-xl p-3 transition-all hover:shadow-md hover:-translate-y-0.5"
      >
        <button
          type="button"
          onClick={() => openCategoryFolder(cat)}
          className="w-full cursor-pointer text-left"
          title="Open category"
        >
          <div className="w-full h-40 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-3">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={cat.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs font-semibold text-gray-400">No Image</span>
            )}
          </div>
        </button>

        <div className="min-w-0 flex-1 mt-3">
          <nav
            className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-500"
            aria-label="Category hierarchy"
          >
            {cardTrail.map((part, index) => (
              <React.Fragment key={`${categoryId}-crumb-${index}`}>
                {index > 0 ? <span className="text-slate-300">›</span> : null}
                <span
                  className={
                    index === cardTrail.length - 1
                      ? "font-semibold text-slate-800"
                      : ""
                  }
                >
                  {part}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Level {typeof cat.level === "number" ? cat.level : browsePath.length}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openCategoryFolder(cat)}
                className="cursor-pointer text-xs text-teal-700 hover:text-teal-800 font-medium"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => openEditModal(cat)}
                className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(categoryId, cat.name)}
                disabled={deletingId === categoryId}
                className="cursor-pointer text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {deletingId === categoryId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
          {cat.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleEnableTree(categoryId)}
              disabled={isAnyStatusActionLoading || enabled}
              className={`cursor-pointer text-xs px-2.5 py-1.5 rounded-lg transition ${
                enabled
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              } disabled:opacity-70`}
            >
              {isEnableLoading ? "Enabling..." : "Enable tree"}
            </button>
            <button
              type="button"
              onClick={() => handleDisableTree(categoryId)}
              disabled={isAnyStatusActionLoading || !enabled}
              className={`cursor-pointer text-xs px-2.5 py-1.5 rounded-lg transition ${
                enabled
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              } disabled:opacity-70`}
            >
              {isDisableLoading ? "Disabling..." : "Disable tree"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <button
          type="button"
          onClick={openCreateModal}
          className="cursor-pointer bg-gradient-to-r from-black to-gray-700 text-white px-4 py-2 rounded-lg text-sm shadow-md hover:scale-105 transition"
        >
          + Create Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <nav
          className="mb-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          aria-label="Category breadcrumb"
        >
          <button
            type="button"
            onClick={() => goToBreadcrumb(-1)}
            className={`cursor-pointer rounded-md px-2 py-1 font-medium transition ${
              browsePath.length === 0
                ? "bg-white text-slate-900 shadow-sm"
                : "text-teal-700 hover:bg-white hover:text-teal-900"
            }`}
          >
            All Categories
          </button>
          {browsePath.map((item, index) => (
            <React.Fragment key={item.id}>
              <span className="text-slate-300" aria-hidden>
                ›
              </span>
              <button
                type="button"
                onClick={() => goToBreadcrumb(index)}
                className={`cursor-pointer rounded-md px-2 py-1 font-medium transition ${
                  index === browsePath.length - 1
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-teal-700 hover:bg-white hover:text-teal-900"
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {currentParent ? currentParent.name : "Main Categories"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{hierarchyLabel}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
            {visibleCategories.length} here
          </span>
        </div>

        {isLoadingCurrentLevel ? (
          <p className="text-gray-500 text-sm">Loading categories...</p>
        ) : visibleCategories.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {currentParent
              ? "No child categories in this folder. Create one with the current parent selected."
              : "No categories found"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleCategories.map((cat) => renderCategoryCard(cat))}
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
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  resetCategoryForm();
                }}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            {!editingCategoryId && browsePath.length > 0 ? (
              <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Creating under:{" "}
                <span className="font-semibold text-slate-800">{hierarchyLabel}</span>
              </p>
            ) : null}

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
                  className="w-full cursor-pointer border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-black outline-none"
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

              <UploadProgressBar progress={uploadProgress} label="Uploading category image…" />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    resetCategoryForm();
                  }}
                  className="cursor-pointer px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="cursor-pointer bg-black text-white px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {saving ? "Uploading…" : editingCategoryId ? "Update" : "Save"}
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
