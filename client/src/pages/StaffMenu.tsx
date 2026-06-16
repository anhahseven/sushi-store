import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  image_url: string;
  is_best_seller?: boolean;
}

interface Category {
  id: number;
  name: string;
}

export const StaffMenu: React.FC = () => {
  const { addToCart, toggleCart } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>( "");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [toastMsg, setToastMsg] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchStaffMenu = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/menu`);
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffMenu();
  }, []);

  const handleAddToCart = async (productId: string | number) => {
    const res = await addToCart(productId);
    if (res.success) {
      setToastType("success");
      setToastMsg(`Added Item #${productId} to Cart`);
      setTimeout(() => setToastMsg(""), 2000);
    } else {
      setToastType("error");
      setToastMsg(res.error || "Failed to add item");
      setTimeout(() => setToastMsg(""), 2000);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayCategories = [{ id: 0, name: "All" }, ...categories];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-24 lg:mt-32 font-sans pb-16 min-h-screen">
      {/* Toast alert */}
      {toastMsg && (
        <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
          <div
            className={`${
              toastType === "error" ? "bg-red-500" : "bg-green-500"
            } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-white/20`}
            style={{ animation: "slideIn 0.3s forwards" }}
          >
            <div className="text-xl">
              <i
                className={`fa-solid ${
                  toastType === "error" ? "fa-circle-exclamation" : "fa-circle-check"
                }`}
              ></i>
            </div>
            <div className="font-bold text-sm">{toastMsg}</div>
          </div>
        </div>
      )}

      {user && (
        <div className="bg-orange-600 text-white p-4 lg:p-6 rounded-xl mb-6 flex justify-between items-center shadow-lg">
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-clipboard-list"></i> STAFF POS
          </h1>
          <div className="text-orange-100 text-xs lg:text-sm font-semibold">
            Operator: {user.email.split("@")[0]}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 lg:mb-10 flex flex-col items-center">
        <div className="relative w-full max-w-4xl group mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Item Code or Name..."
            className="w-full pl-12 pr-4 py-3 lg:pl-14 lg:pr-8 lg:py-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm text-base lg:text-lg text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
          <div className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-gray-400 text-lg lg:text-xl">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>

        {/* Category filters */}
        <div className="w-full overflow-x-auto pb-4 no-scrollbar flex justify-start 2xl:justify-center">
          <div className="flex flex-nowrap gap-2 px-4">
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all flex-shrink-0 ${
                  activeCategory === cat.name
                    ? "bg-indigo-600 text-white shadow-3d-indigo scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-3d-gray hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading POS Menu...</div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            if (activeCategory !== "All" && activeCategory !== category.name) return null;

            const categoryProducts =
              category.name === "Most Sales"
                ? filteredProducts.filter((p) => p.is_best_seller)
                : filteredProducts.filter((p) => p.category === category.name);

            if (categoryProducts.length === 0) return null;

            return (
              <section key={category.id} className="mb-8 lg:mb-12">
                <h2 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-white mb-4 lg:mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                  <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
                  {category.name}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all overflow-hidden product-card group flex flex-row sm:flex-col h-24 sm:h-auto"
                    >
                      <div className="w-24 sm:w-full h-full sm:h-36 relative flex-shrink-0">
                        <img
                          src={product.image_url || "https://via.placeholder.com/150"}
                          className="w-full h-full object-cover"
                          alt={product.name}
                          loading="lazy"
                        />
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className="hidden sm:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 items-center justify-center text-white transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-plus text-3xl"></i>
                        </button>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between sm:block">
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-tight mb-1 product-name line-clamp-2">
                            {product.name}
                          </h3>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm sm:text-base">
                            {product.price} $
                          </span>
                        </div>

                        <div className="flex justify-end sm:justify-between items-center sm:mt-2">
                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="hidden sm:block text-xs bg-orange-50 dark:bg-gray-700 text-orange-600 dark:text-orange-400 px-3 py-1 rounded hover:bg-orange-100 dark:hover:bg-gray-600 font-bold transition-colors"
                          >
                            Add
                          </button>

                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="sm:hidden w-8 h-8 bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center active:bg-orange-500 active:text-white transition-colors focus:outline-none"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Floating cart view trigger for staff */}
      <button
        onClick={toggleCart}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95 focus:outline-none"
      >
        <i className="fa-solid fa-cash-register text-xl"></i>
      </button>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
