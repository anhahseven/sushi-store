import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Navbar } from "../components/Navbar";

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
  const { items, addToCart, updateQty, deleteCartItem, cartCount, cartTotal, showStaffTicket, toggleStaffTicket } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);


  const observerTarget = useRef<HTMLDivElement>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(10);

  useEffect(() => {
    setVisibleLimit(10);
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleLimit((prev) => prev + 10);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [products, activeCategory, searchTerm]);

  useEffect(() => {
    // Force light theme for Staff POS Menu
    const root = window.document.documentElement;
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

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
      const isDark = document.documentElement.classList.contains("dark");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Added to ticket",
        showConfirmButton: false,
        timer: 1000,
        background: isDark ? "#1f2937" : "#ffffff",
        color: isDark ? "#ffffff" : "#1f2937",
      });
    } else {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: res.error || "Failed to add item",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  };

  const handleClearCart = async () => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Clear Ticket?",
      text: "Are you sure you want to remove all items from the current ticket?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, clear it",
      background: isDark ? "#1f2937" : "#ffffff",
      color: isDark ? "#ffffff" : "#1f2937",
    });

    if (result.isConfirmed) {
      for (const item of items) {
        await deleteCartItem(item.cart_id);
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ticket cleared",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  const handleConfirmOrder = async () => {
    if (!tableNumber) {
      Swal.fire({
        icon: "warning",
        title: "Table Required",
        text: "Please select a Table Number or Choose Takeaway first!",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Place Order?",
      text: `Send this order to Table ${tableNumber}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, send order",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/orders`, { table_number: tableNumber });
      Swal.fire({
        icon: "success",
        title: "Order Confirmed",
        text: res.data.message || "Order placed successfully!",
        confirmButtonColor: "#10b981",
      });
      setTableNumber("");
      navigate("/admin/orders");
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.response?.data?.error || "Error processing order",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const isDark = document.documentElement.classList.contains("dark");
    const { value: password } = await Swal.fire({
      title: "Confirm Password",
      text: "Please enter your password to sign out of the staff account:",
      input: "password",
      inputPlaceholder: "Enter your password",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off"
      },
      showCancelButton: true,
      confirmButtonText: "Sign Out",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      background: isDark ? "#1f2937" : "#ffffff",
      color: isDark ? "#ffffff" : "#1f2937"
    });

    if (password === undefined) return; // User cancelled

    if (!password) {
      Swal.fire({
        icon: "error",
        title: "Password Required",
        text: "You must enter a password to sign out.",
        confirmButtonColor: "#ef4444",
        background: isDark ? "#1f2937" : "#ffffff",
        color: isDark ? "#ffffff" : "#1f2937"
      });
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-password`, { password });
      if (res.data.success) {
        await logout();
        navigate("/login");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Sign Out Failed",
        text: err.response?.data?.error || "Incorrect password. Please try again.",
        confirmButtonColor: "#ef4444",
        background: isDark ? "#1f2937" : "#ffffff",
        color: isDark ? "#ffffff" : "#1f2937"
      });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory !== "All") {
      if (activeCategory === "Most Sales") {
        return !!product.is_best_seller;
      }
      return product.category === activeCategory;
    }
    return true;
  });

  const displayedProducts = filteredProducts.slice(0, visibleLimit);

  const displayCategories = [{ id: 0, name: "All" }, ...categories];

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-[#f9fafb] dark:bg-[#030712] text-gray-900 dark:text-white font-sans transition-colors duration-300">
      <Navbar />
      
      {/* LEFT COLUMN: Menu Browser */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-6 pt-24 lg:pt-28 pb-6">
        
        {/* Staff POS Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-[2rem] shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
              <i className="fa-solid fa-cash-register text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Staff POS Terminal</h1>
              <p className="text-[10px] text-gray-450 dark:text-zinc-400 uppercase tracking-widest font-semibold">Murakami Sushi</p>
            </div>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto flex-wrap">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Operator: <span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 px-3 py-1 rounded-full">{user.email.split("@")[0]}</span>
                  </span>
                </div>
                {["manager", "admin", "store_manager"].includes(user.role.trim().toLowerCase()) && (
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-900 text-[11.5px] font-bold px-4 py-2 rounded-full shadow-md transition-all border-0 cursor-pointer"
                    title="Go to Dashboard"
                  >
                    <i className="fa-solid fa-chart-pie text-xs text-orange-500"></i>
                    <span>Dashboard</span>
                  </button>
                )}
              </>
            )}

          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 text-base lg:text-lg">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes by code, name..."
              className="w-full pl-12 lg:pl-14 pr-8 py-3 lg:py-4 rounded-full border-0 bg-white dark:bg-gray-800 shadow-lg text-sm lg:text-base text-gray-700 dark:text-white focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/45 focus:outline-none transition-all font-medium"
            />
          </div>

          {/* Categories Horizontal Scroller */}
          <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-2.5 py-1">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all flex-shrink-0 cursor-pointer ${
                    activeCategory === cat.name
                      ? "bg-orange-500 text-white shadow-3d-orange scale-105"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-3d-gray hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-500"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-850">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-orange-500"></i>
              <span>Loading menu items...</span>
            </div>
          ) : (
            categories.map((category) => {
              if (activeCategory !== "All" && activeCategory !== category.name) return null;

              const categoryProducts =
                category.name === "Most Sales"
                  ? displayedProducts.filter((p) => p.is_best_seller)
                  : displayedProducts.filter((p) => p.category === category.name);

              if (categoryProducts.length === 0) return null;

              return (
                <section key={category.id} className="space-y-4">
                  <h2 className="text-lg lg:text-2xl font-extrabold text-gray-900 dark:text-white mb-4 lg:mb-6 border-b border-gray-200 dark:border-gray-855 pb-3 flex items-center gap-2">
                    {category.name === "Most Sales" ? "🔥 Best Sellers" : `${category.name} Collection`}
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleAddToCart(product.id)}
                        className="group relative h-56 lg:h-[350px] w-full rounded-2xl lg:rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl product-card border border-gray-100 dark:border-gray-800 transition-all duration-300 cursor-pointer"
                      >
                        {/* Image background */}
                        <div className="absolute inset-0 w-full h-full">
                          <img
                            src={product.image_url || "https://via.placeholder.com/300"}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                            alt={product.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        </div>

                        {product.is_best_seller && (
                          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] lg:text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md z-20">
                            Popular
                          </span>
                        )}

                        {/* Title and price info */}
                        <div className="absolute bottom-0 left-0 w-full p-3 lg:p-6 z-20 flex items-end justify-between">
                          <div className="flex flex-col gap-0.5 lg:gap-1 w-[70%]">
                            <h3 className="text-white text-sm lg:text-2xl font-bold product-name leading-tight drop-shadow-md line-clamp-2">
                              {product.name}
                            </h3>
                            <span className="text-orange-300 text-sm lg:text-2xl font-bold">
                              {Number(product.price).toFixed(2)} $
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product.id);
                            }}
                            className="w-8 h-8 lg:w-14 lg:h-14 bg-white dark:bg-gray-800 text-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-500 hover:text-white transition-all transform active:scale-95 border-0 cursor-pointer"
                          >
                            <i className="fa-solid fa-basket-shopping text-xs lg:text-xl"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
          
          {visibleLimit < filteredProducts.length && (
            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-6">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-orange-500 animate-pulse"></i>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Ticket / Bill Calculator */}
      <aside className={`transition-all duration-300 flex flex-col shrink-0 z-10 shadow-2xl bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 text-gray-950 dark:text-white overflow-hidden ${
        showStaffTicket 
          ? "w-full lg:w-[380px] h-[400px] lg:h-full pt-6 lg:pt-28 pb-6 px-6 opacity-100" 
          : "w-0 h-0 lg:w-0 lg:h-full opacity-0 pointer-events-none p-0 border-transparent"
      }`}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStaffTicket}
              className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white mr-1 transition-colors flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 border-0 cursor-pointer"
              title="Hide Ticket"
            >
              <i className="fa-solid fa-chevron-down text-sm"></i>
            </button>
            <button
              onClick={toggleStaffTicket}
              className="hidden lg:flex text-gray-400 hover:text-gray-600 dark:hover:text-white mr-1 transition-colors items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 border-0 cursor-pointer"
              title="Hide Ticket"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Current Ticket</h2>
            <span className="bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold">
              {cartCount} items
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <i className="fa-solid fa-trash-can"></i> Clear Ticket
            </button>
          )}
        </div>

        {/* Scrollable Order Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-805 animate-fade-in">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center gap-3 py-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-400 shadow-inner">
                <i className="fa-solid fa-cart-shopping text-xl animate-pulse text-gray-300 dark:text-gray-600"></i>
              </div>
              <div>
                <p className="font-bold text-xs text-gray-700 dark:text-gray-300">No Items Added</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Click menu items to add them here</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cart_id}
                className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/60 p-3 rounded-2xl flex items-center justify-between gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">{item.name}</h4>
                  <p className="text-[10px] text-orange-500 font-semibold mt-0.5">
                    {Number(item.price).toFixed(2)} $
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.cart_id, "decrement")}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 flex items-center justify-center text-xs transition-colors font-bold text-gray-700 dark:text-gray-300 cursor-pointer shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.cart_id, "increment")}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-700 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 flex items-center justify-center text-xs transition-colors font-bold text-gray-700 dark:text-gray-300 cursor-pointer shadow-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      const isDark = document.documentElement.classList.contains("dark");
                      Swal.fire({
                        title: "Remove Item?",
                        text: "Are you sure you want to remove this item?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#ef4444",
                        cancelButtonColor: "#6b7280",
                        confirmButtonText: "Yes, remove it",
                        background: isDark ? "#1f2937" : "#ffffff",
                        color: isDark ? "#ffffff" : "#1f2937",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          deleteCartItem(item.cart_id);
                        }
                      });
                    }}
                    className="w-6 h-6 rounded-md bg-red-55 hover:bg-red-550 text-red-500 hover:text-white flex items-center justify-center text-xs transition-colors ml-1 border border-red-200 dark:border-transparent dark:bg-red-900/10 cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing & Checkout Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-550 dark:text-gray-400 mb-1.5">
              Service / Table Location
            </label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-3 text-xs text-gray-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold shadow-sm transition-all"
            >
              <option value="">Select Service / Table</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={String(num)}>
                  Table {num}
                </option>
              ))}
              <option value="Takeaway">Takeaway</option>
            </select>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-gray-50/50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{Number(cartTotal).toFixed(2)} $</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Service Tax (10% VAT)</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{Number(cartTotal * 0.1).toFixed(2)} $</span>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold border-t border-gray-100 dark:border-gray-800 pt-2 text-gray-900 dark:text-white">
              <span>Total Payable</span>
              <span className="text-orange-500 dark:text-orange-400">{Number(cartTotal * 1.1).toFixed(2)} $</span>
            </div>
          </div>

          <button
            disabled={items.length === 0 || submitting}
            onClick={handleConfirmOrder}
            className="w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-orange-500/20 active:scale-95 border-0 cursor-pointer"
          >
            <i className="fa-solid fa-paper-plane"></i>
            {submitting ? "Placing Order..." : "Confirm & Send Order"}
          </button>
        </div>
      </aside>

    </div>
  );
};
