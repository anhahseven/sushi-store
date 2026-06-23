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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
    <>
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
              <div className="relative hidden lg:block" ref={profileRef}>
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
    </nav>

    {/* Animated Mobile Menu Drawer */}
    <div
      className={`lg:hidden fixed inset-0 z-[9999] transition-opacity duration-300 ${
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
        {/* Backdrop glass blur */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
        />

        {/* Drawer Panel */}
        <div
          className={`fixed top-0 left-0 bottom-0 h-full w-[300px] max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl flex flex-col justify-between p-6 pt-24 transition-transform duration-300 ease-out transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Top Panel Brand & User Profile */}
          <div className="absolute top-6 left-6 flex justify-between items-center w-[calc(100%-48px)]">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm font-bold text-base">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                    {user.email.split("@")[0]}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-600">
                    {user.role}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xl font-extrabold text-gray-900 dark:text-orange-400">
                Murakami<span className="text-orange-500">.</span>
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          {/* Scrollable Links Section */}
          <div className="flex-1 overflow-y-auto my-4 pr-1.5 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-gray-200/60 dark:scrollbar-thumb-gray-850/60">
            {/* 1. Client / Customer Links (Home, Menu, About, Offers, Locations) */}
            {(!user || !["staff", "cashier"].includes(user.role.trim().toLowerCase())) && (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                    currentPath === "/"
                      ? "text-orange-500 translate-x-2"
                      : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                  }`}
                  style={{
                    transitionDelay: mobileMenuOpen ? "100ms" : "0ms",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                    transition: "transform 0.4s ease, opacity 0.4s ease"
                  }}
                >
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                    <i className="fa-solid fa-house text-sm"></i>
                  </span>
                  <span>Home</span>
                </Link>

                <Link
                  to="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                    currentPath === "/menu"
                      ? "text-orange-500 translate-x-2"
                      : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                  }`}
                  style={{
                    transitionDelay: mobileMenuOpen ? "150ms" : "0ms",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                    transition: "transform 0.4s ease, opacity 0.4s ease"
                  }}
                >
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                    <i className="fa-solid fa-utensils text-sm"></i>
                  </span>
                  <span>Menu</span>
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                    currentPath === "/about"
                      ? "text-orange-500 translate-x-2"
                      : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                  }`}
                  style={{
                    transitionDelay: mobileMenuOpen ? "200ms" : "0ms",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                    transition: "transform 0.4s ease, opacity 0.4s ease"
                  }}
                >
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                    <i className="fa-solid fa-circle-info text-sm"></i>
                  </span>
                  <span>About</span>
                </Link>

                <Link
                  to="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                    currentPath === "/offers"
                      ? "text-orange-500 translate-x-2"
                      : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                  }`}
                  style={{
                    transitionDelay: mobileMenuOpen ? "250ms" : "0ms",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                    transition: "transform 0.4s ease, opacity 0.4s ease"
                  }}
                >
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                    <i className="fa-solid fa-tag text-sm"></i>
                  </span>
                  <span>Offers</span>
                </Link>

                <Link
                  to="/location"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                    currentPath === "/location" || currentPath === "/locations"
                      ? "text-orange-500 translate-x-2"
                      : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                  }`}
                  style={{
                    transitionDelay: mobileMenuOpen ? "300ms" : "0ms",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                    transition: "transform 0.4s ease, opacity 0.4s ease"
                  }}
                >
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                    <i className="fa-solid fa-map-location-dot text-sm"></i>
                  </span>
                  <span>Locations</span>
                </Link>
              </>
            )}

            {/* 2. Login button (if Guest) */}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-4 text-xl font-bold text-gray-600 hover:text-gray-900 hover:translate-x-1 transition-all duration-300"
                style={{
                  transitionDelay: mobileMenuOpen ? "350ms" : "0ms",
                  opacity: mobileMenuOpen ? 1 : 0,
                  transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                  transition: "transform 0.4s ease, opacity 0.4s ease"
                }}
              >
                <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                  <i className="fa-solid fa-right-to-bracket text-sm"></i>
                </span>
                <span>Login</span>
              </Link>
            )}

            {/* 3. Authenticated Profile & Role Options */}
            {isAuthenticated && user && (
              <>
                <div className="border-t border-gray-150/80 my-1"></div>

                {/* Profile (Customer only) */}
                {user.role?.trim().toLowerCase() === "user" && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                        currentPath === "/profile"
                          ? "text-orange-500 translate-x-2"
                          : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                      }`}
                      style={{
                        transitionDelay: mobileMenuOpen ? "350ms" : "0ms",
                        opacity: mobileMenuOpen ? 1 : 0,
                        transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                        transition: "transform 0.4s ease, opacity 0.4s ease"
                      }}
                    >
                      <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                        <i className="fa-solid fa-user text-sm"></i>
                      </span>
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                        currentPath === "/orders"
                          ? "text-orange-500 translate-x-2"
                          : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                      }`}
                      style={{
                        transitionDelay: mobileMenuOpen ? "400ms" : "0ms",
                        opacity: mobileMenuOpen ? 1 : 0,
                        transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                        transition: "transform 0.4s ease, opacity 0.4s ease"
                      }}
                    >
                      <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                        <i className="fa-solid fa-receipt text-sm"></i>
                      </span>
                      <span>Orders</span>
                    </Link>
                  </>
                )}

                {/* Dashboard (Admin/Manager) */}
                {["manager", "admin", "store_manager"].includes(user.role?.trim().toLowerCase()) && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                      currentPath === "/admin/dashboard"
                        ? "text-orange-500 translate-x-2"
                        : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                    }`}
                    style={{
                      transitionDelay: mobileMenuOpen ? "350ms" : "0ms",
                      opacity: mobileMenuOpen ? 1 : 0,
                      transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                      transition: "transform 0.4s ease, opacity 0.4s ease"
                    }}
                  >
                    <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                      <i className="fa-solid fa-chart-pie text-sm"></i>
                    </span>
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* POS Menu (Staff/Manager/Admin) */}
                {["manager", "admin", "store_manager", "staff"].includes(user.role?.trim().toLowerCase()) && (
                  <Link
                    to="/staff/menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                      currentPath === "/staff/menu"
                        ? "text-orange-500 translate-x-2"
                        : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                    }`}
                    style={{
                      transitionDelay: mobileMenuOpen ? "400ms" : "0ms",
                      opacity: mobileMenuOpen ? 1 : 0,
                      transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                      transition: "transform 0.4s ease, opacity 0.4s ease"
                    }}
                  >
                    <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                      <i className="fa-solid fa-utensils text-sm"></i>
                    </span>
                    <span>POS Menu</span>
                  </Link>
                )}

                {/* POS Checkout (Cashier/Manager/Admin) */}
                {["manager", "admin", "store_manager", "cashier"].includes(user.role?.trim().toLowerCase()) && (
                  <Link
                    to="/admin/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 text-xl font-bold transition-all duration-300 ${
                      currentPath === "/admin/orders"
                        ? "text-orange-500 translate-x-2"
                        : "text-gray-600 hover:text-gray-900 hover:translate-x-1"
                    }`}
                    style={{
                      transitionDelay: mobileMenuOpen ? "450ms" : "0ms",
                      opacity: mobileMenuOpen ? 1 : 0,
                      transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                      transition: "transform 0.4s ease, opacity 0.4s ease"
                    }}
                  >
                    <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                      <i className="fa-solid fa-cash-register text-sm"></i>
                    </span>
                    <span>POS Checkout</span>
                  </Link>
                )}

                <div className="border-t border-gray-150/80 my-1"></div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-4 text-xl font-bold text-red-600 hover:text-red-800 hover:translate-x-1 transition-all duration-300 text-left w-full"
                  style={{
                    transitionDelay: mobileMenuOpen ? "500ms" : "0ms",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateX(0)" : "translateX(-20px)",
                    transition: "transform 0.4s ease, opacity 0.4s ease"
                  }}
                >
                  <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
                    <i className="fa-solid fa-right-from-bracket text-sm"></i>
                  </span>
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>

          {/* Bottom Branding / Info inside Drawer */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-600 mt-auto border-t border-gray-100 dark:border-gray-900 pt-4">
            <p className="font-semibold">Murakami Sushi Store</p>
            <p className="mt-1 font-light">&copy; 2026 Murakami. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};
