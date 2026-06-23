import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useHeader } from "../../context/HeaderContext";

interface Category {
  id: number;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminCategory() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Form states
  const [addName, setAddName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/category`, { withCredentials: true });
      setCategories(res.data.categories || []);
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error loading categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    const isDark = document.documentElement.classList.contains("dark");
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: type,
      title: message,
      background: isDark ? "#1f2937" : "#ffffff",
      color: isDark ? "#ffffff" : "#1f2937",
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/category`, { name: addName }, { withCredentials: true });
      showNotification("Category Created!", "success");
      setAddModalOpen(false);
      setAddName("");
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error creating category", "error");
    }
  };

  const handleOpenEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditModalOpen(true);
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDark = document.documentElement.classList.contains("dark");

    const result = await Swal.fire({
      title: "Update Category?",
      text: "Save changes to this category?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, update category",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.patch(`${API_BASE}/api/category/${editId}`, { name: editName }, { withCredentials: true });
      showNotification("Category Updated!", "success");
      setEditModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error updating category", "error");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Delete Category?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/category/${id}`, { withCredentials: true });
      showNotification("Category Deleted", "success");
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error deleting category", "error");
    }
  };

  const userRole = user?.role || "user";
  const isAdmin = userRole.trim().toLowerCase() === "admin" || userRole.trim().toLowerCase() === "demo";

  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent(
      <button
        onClick={() => setAddModalOpen(true)}
        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1 shrink-0"
      >
        <i className="fa-solid fa-plus text-[10px]"></i> Add Category
      </button>
    );
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading categories...
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center relative group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 flex items-center justify-center text-2xl mb-4">
                <i className="fa-solid fa-layer-group"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{category.name}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">ID: #{category.id}</p>

              <div className="flex gap-2 w-full justify-center mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                <button
                  onClick={() => handleOpenEdit(category)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition"
                >
                  <i className="fa-solid fa-pen"></i> Edit
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-605 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-sm font-medium transition"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 transition-colors">
          <div className="text-gray-300 dark:text-gray-700 text-4xl mb-3">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No Categories Found</h3>
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border dark:border-gray-800 transition-colors animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-855 dark:text-white">New Category</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mt-2 shadow-sm transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border dark:border-gray-800 transition-colors animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950 rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-855 dark:text-white">Edit Category</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold mt-2 shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
