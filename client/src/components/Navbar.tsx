import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Swal from "sweetalert2";
import axios from "axios";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleCart, cartCount, toggleStaffTicket } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<string>("light");
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync theme class - Force light theme globally
    const root = window.document.documentElement;
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  useEffect(() => {
    // Handle click outside to close profile dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    if (user && user.role.trim().toLowerCase() === "staff") {
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

      const API_BASE = import.meta.env.VITE_API_URL || "";
      try {
        const res = await axios.post(`${API_BASE}/api/auth/verify-password`, { password });
        if (res.data.success) {
          await logout();
          setProfileOpen(false);
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
    } else {
      await logout();
      setProfileOpen(false);
      navigate("/login");
    }
  };

  const isStaff = user && ["manager", "admin", "store_manager", "staff", "cashier"].includes(user.role.trim().toLowerCase());
  const isAdminOrManager = user && ["manager", "admin", "store_manager"].includes(user.role.trim().toLowerCase());

  const currentPath = location.pathname;

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-gray-200/30 dark:border-gray-800/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 lg:px-8 lg:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="text-2xl lg:text-3xl font-extrabold tracking-tight z-50">
            <Link
              to={
                user && ["manager", "admin", "store_manager", "staff"].includes(user.role.trim().toLowerCase())
                  ? "/staff/menu"
                  : user && user.role.trim().toLowerCase() === "cashier"
                  ? "/admin/orders"
                  : "/"
              }
              className="text-gray-900 dark:text-orange-400"
            >
              Murakami<span className="text-orange-500">.</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {(!user || !["staff", "cashier"].includes(user.role.trim().toLowerCase())) && (
            <div className="hidden lg:flex items-center gap-1 p-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#030712]/90 shadow-sm">
              <Link
                to="/"
                className={`expandable-tab flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  currentPath === "/"
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <i className="fa-solid fa-house text-[18px]"></i>
                <span className="ml-2">Home</span>
              </Link>

              <Link
                to="/menu"
                className={`expandable-tab flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  currentPath === "/menu"
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <i className="fa-solid fa-utensils text-[18px]"></i>
                <span className="ml-2">Menu</span>
              </Link>

              <div className="mx-1 h-[24px] w-[1.5px] bg-gray-200 dark:bg-gray-700"></div>

              <Link
                to="/about"
                className={`expandable-tab flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  currentPath === "/about"
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <i className="fa-solid fa-circle-info text-[18px]"></i>
                <span className="ml-2">About</span>
              </Link>

              <Link
                to="/offers"
                className={`expandable-tab flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  currentPath === "/offers"
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <i className="fa-solid fa-tag text-[18px]"></i>
                <span className="ml-2">Offers</span>
              </Link>

              <Link
                to="/location"
                className={`expandable-tab flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  currentPath === "/location"
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <i className="fa-solid fa-map-location-dot text-[18px]"></i>
                <span className="ml-2">Locations</span>
              </Link>
            </div>
          )}


          {/* Right Side Buttons */}
          <div className="flex items-center gap-3 lg:gap-6">

            {/* Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-700 dark:text-orange-400 transition-all focus:outline-none"
                >
                  <i className="fa-solid fa-user"></i>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-[#030712]/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fade-in-down">
                    <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-orange-400 truncate">
                        {user.email.split("@")[0]}
                      </p>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                        {user.role}
                      </span>
                    </div>
                    {user.role === "user" && (
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <i className="fa-solid fa-user mr-2 text-gray-400"></i> Profile
                      </Link>
                    )}
                    {user && ["manager", "admin", "store_manager"].includes(user.role.trim().toLowerCase()) && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100/60 dark:border-gray-800/60"
                      >
                        <i className="fa-solid fa-chart-pie mr-2 text-gray-405"></i> Dashboard
                      </Link>
                    )}
                    {user && ["manager", "admin", "store_manager", "staff"].includes(user.role.trim().toLowerCase()) && (
                      <Link
                        to="/staff/menu"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100/60 dark:border-gray-800/60"
                      >
                        <i className="fa-solid fa-utensils mr-2 text-gray-405"></i> POS Menu
                      </Link>
                    )}
                    {user && ["manager", "admin", "store_manager", "cashier"].includes(user.role.trim().toLowerCase()) && (
                      <Link
                        to="/admin/orders"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100/60 dark:border-gray-800/60"
                      >
                        <i className="fa-solid fa-cash-register mr-2 text-gray-405"></i> POS Checkout
                      </Link>
                    )}
                    {user.role === "user" && (
                      <Link
                        to="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100/60 dark:border-gray-800/60"
                      >
                        <i className="fa-solid fa-receipt mr-2 text-gray-400"></i> Orders
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="desktop-link text-sm font-bold text-gray-800 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors"
              >
                Login
              </Link>
            )}

            {/* Dark Mode Toggle removed - Forced light theme */}

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={currentPath === "/staff/menu" ? toggleStaffTicket : toggleCart}
              className="relative w-10 h-10 flex items-center justify-center text-gray-700 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition"
            >
              <i className="fa-solid fa-shopping-bag text-xl"></i>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-800 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
            >
              <i
                className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"} text-xl`}
              ></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-50/95 dark:bg-[#030712]/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 absolute w-full left-0 shadow-lg transition-all duration-350">
          <div className="flex flex-col p-4 space-y-2">
            {(!user || !["staff", "cashier"].includes(user.role.trim().toLowerCase())) && (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <i className="fa-solid fa-house w-6 text-center text-gray-400"></i> Home
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <i className="fa-solid fa-utensils w-6 text-center text-gray-400"></i> Menu
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <i className="fa-solid fa-circle-info w-6 text-center text-gray-400"></i> About
                </Link>
                <Link
                  to="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <i className="fa-solid fa-tag w-6 text-center text-gray-400"></i> Offers
                </Link>
                <Link
                  to="/location"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <i className="fa-solid fa-map-location-dot w-6 text-center text-gray-400"></i>{" "}
                  Locations
                </Link>
                {!isAuthenticated && (
                  <>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-2"></div>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                    >
                      <i className="fa-solid fa-right-to-bracket w-6 text-center text-gray-400"></i>{" "}
                      Login
                    </Link>
                  </>
                )}
              </>
            )}

            {isAuthenticated && isAdminOrManager && (
              <>
                <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-2"></div>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-link flex items-center p-3 rounded-lg font-semibold dark:text-orange-300 text-gray-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <i className="fa-solid fa-chart-pie w-6 text-center text-gray-400"></i> Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
