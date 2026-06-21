import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

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
  const { items, addToCart, updateQty, deleteCartItem, cartCount, cartTotal } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showTicket, setShowTicket] = useState<boolean>(true);

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
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-zinc-950 text-white font-sans">
      
      {/* LEFT COLUMN: Menu Browser */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-6 pt-24 lg:pt-28 pb-6">
        
        {/* Staff POS Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
              <i className="fa-solid fa-cash-register text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Staff POS Terminal</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Murakami Sushi</p>
            </div>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto flex-wrap">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs text-gray-300">
                    Operator: <span className="font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">{user.email.split("@")[0]}</span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[11px] font-extrabold px-3 py-2 rounded-xl border border-red-700/30 transition-all shadow-md shadow-red-500/20"
                  title="Sign Out"
                >
                  <i className="fa-solid fa-right-from-bracket text-xs"></i>
                  <span>Sign Out</span>
                </button>
              </>
            )}
            <button
              onClick={() => setShowTicket(!showTicket)}
              className="relative w-10 h-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl border border-orange-600/30 transition-all shadow-md shadow-orange-500/20"
              title={showTicket ? "Hide Ticket" : "Show Ticket"}
            >
              <i className={`fa-solid ${showTicket ? "fa-eye-slash" : "fa-cart-shopping"} text-base`}></i>
              {!showTicket && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow animate-fade-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes by code, name..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-sm"
            />
          </div>

          {/* Categories Horizontal Scroller */}
          <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-2 pb-1">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex-shrink-0 border ${
                    activeCategory === cat.name
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-105"
                      : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
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
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                    {category.name}
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleAddToCart(product.id)}
                        className="bg-white/5 border border-white/10 hover:border-orange-500/40 rounded-2xl p-2.5 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between h-[270px] relative overflow-hidden"
                      >
                        {/* Zoomable Image Container */}
                        <div className="h-36 rounded-xl overflow-hidden relative bg-zinc-900 border border-white/5">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              alt={product.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-1 bg-zinc-950">
                              <i className="fa-solid fa-pizza-slice text-3xl"></i>
                              <span className="text-[10px] uppercase font-bold text-gray-500">No Image</span>
                            </div>
                          )}
                          {product.is_best_seller && (
                            <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md">
                              Popular
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="mt-3 flex flex-col justify-between flex-1">
                          <h3 className="font-bold text-xs text-gray-200 group-hover:text-white line-clamp-2 leading-snug">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <span className="text-orange-400 font-extrabold text-sm">{Number(product.price).toFixed(2)} $</span>
                            <button className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                              <i className="fa-solid fa-plus text-xs"></i>
                            </button>
                          </div>
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
      <aside className={`transition-all duration-300 flex flex-col shrink-0 z-10 shadow-2xl bg-slate-900/90 backdrop-blur-lg overflow-hidden ${
        showTicket 
          ? "w-full lg:w-[380px] h-[400px] lg:h-full pt-6 lg:pt-28 pb-6 px-6 border-t lg:border-t-0 lg:border-l border-white/10 opacity-100" 
          : "w-0 h-0 lg:w-0 lg:h-full opacity-0 pointer-events-none p-0 border-transparent"
      }`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTicket(false)}
              className="lg:hidden text-gray-400 hover:text-white mr-1 transition-colors flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/5"
              title="Hide Ticket"
            >
              <i className="fa-solid fa-chevron-down text-sm"></i>
            </button>
            <button
              onClick={() => setShowTicket(false)}
              className="hidden lg:flex text-gray-400 hover:text-white mr-1 transition-colors items-center justify-center w-6 h-6 rounded-md hover:bg-white/5"
              title="Hide Ticket"
            >
              <i className="fa-solid fa-chevron-right text-sm"></i>
            </button>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Current Ticket</h2>
            <span className="bg-orange-500/15 text-orange-400 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold">
              {cartCount} items
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-trash-can"></i> Clear Ticket
            </button>
          )}
        </div>

        {/* Scrollable Order Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10 animate-fade-in">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center gap-3 py-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shadow-inner">
                <i className="fa-solid fa-cart-shopping text-xl"></i>
              </div>
              <div>
                <p className="font-bold text-xs text-gray-300">No Items Added</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Click menu items to add them here</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cart_id}
                className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-gray-105 truncate">{item.name}</h4>
                  <p className="text-[10px] text-orange-400 font-semibold mt-0.5">
                    {Number(item.price).toFixed(2)} $
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.cart_id, "decrement")}
                    className="w-6 h-6 rounded-md bg-white/5 hover:bg-orange-500 hover:text-white flex items-center justify-center text-xs transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.cart_id, "increment")}
                    className="w-6 h-6 rounded-md bg-white/5 hover:bg-orange-500 hover:text-white flex items-center justify-center text-xs transition-colors font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Remove item?")) {
                        deleteCartItem(item.cart_id);
                      }
                    }}
                    className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center text-xs transition-colors ml-1"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing & Checkout Section */}
        <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
              Service / Table Location
            </label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
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
          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-200">{Number(cartTotal).toFixed(2)} $</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Service Tax (10% VAT)</span>
              <span className="font-semibold text-gray-200">{Number(cartTotal * 0.1).toFixed(2)} $</span>
            </div>
            <div className="flex items-center justify-between text-sm font-extrabold border-t border-white/10 pt-2 text-white">
              <span>Total Payable</span>
              <span className="text-orange-400">{Number(cartTotal * 1.1).toFixed(2)} $</span>
            </div>
          </div>

          <button
            disabled={items.length === 0 || submitting}
            onClick={handleConfirmOrder}
            className="w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-orange-500/20 active:scale-95"
          >
            <i className="fa-solid fa-paper-plane"></i>
            {submitting ? "Placing Order..." : "Confirm & Send Order"}
          </button>
        </div>
      </aside>

    </div>
  );
};
