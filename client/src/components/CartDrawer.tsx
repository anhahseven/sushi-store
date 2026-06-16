import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export const CartDrawer: React.FC = () => {
  const { items, isOpen, toggleCart, updateQty, deleteCartItem, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  if (!isOpen) return null;

  const isStaff = user && ["admin", "manager", "store_manager", "staff", "cashier"].includes(user.role.trim().toLowerCase());

  const handleCreateStaffOrder = async () => {
    if (!tableNumber) {
      alert("Please select a Table Number first!");
      return;
    }
    const confirmOrder = window.confirm(`Send this order to Table ${tableNumber}?`);
    if (!confirmOrder) return;

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/orders`, { table_number: tableNumber });
      alert(res.data.message || "Order placed successfully!");
      toggleCart();
      navigate("/admin/orders");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 opacity-100"
        onClick={toggleCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-gray-900 z-[70] transition-transform duration-300 cart-3d flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Order</h2>
          <button
            onClick={toggleCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center mt-10">
              <i className="fa-solid fa-basket-shopping text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">Your cart is empty.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cart_id}
                className="flex gap-4 border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0"
              >
                <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Unit: {item.price} $
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.price * item.quantity} $
                    </span>
                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1">
                      <button
                        onClick={() => updateQty(item.cart_id, "decrement")}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-orange-500 font-bold transition"
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.cart_id, "increment")}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-orange-500 font-bold transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Remove this item?")) {
                            deleteCartItem(item.cart_id);
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 font-bold transition ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex justify-between font-bold text-lg mb-6">
            <span className="dark:text-white">Total</span>
            <span className="text-orange-500">{cartTotal.toLocaleString()} $</span>
          </div>

          {isStaff ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                  Select Table
                </label>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 dark:text-white"
                >
                  <option value="">-- Choose Table --</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={String(num)}>
                      Table {num}
                    </option>
                  ))}
                  <option value="Takeaway">Takeaway</option>
                </select>
              </div>

              <button
                disabled={items.length === 0 || submitting}
                onClick={handleCreateStaffOrder}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-full flex items-center justify-center shadow-3d-indigo transition-all"
              >
                <i className="fa-solid fa-paper-plane mr-2"></i>{" "}
                {submitting ? "Processing..." : "Confirm Order"}
              </button>
            </div>
          ) : (
            <Link
              to="/checkout"
              onClick={toggleCart}
              className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-full flex items-center justify-center shadow-3d-orange transition-all ${
                items.length === 0 ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              Proceed to Checkout
            </Link>
          )}
        </div>
      </div>
    </>
  );
};
