import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Swal from "sweetalert2";

interface LocationItem {
  id: number;
  name: string;
  address: string;
  status: string;
}

export const Checkout: React.FC = () => {
  const { items, cartTotal, fetchCart } = useCart();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/checkout`);
        setLocations(res.data.locations || []);
      } catch (err) {
        console.error("Error loading checkout data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      Swal.fire({
        icon: "warning",
        title: "Store Location Required",
        text: "Please select a store location for your pickup order.",
        confirmButtonColor: "#f97316"
      });
      return;
    }
    setSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE}/api/orders`, {
        pickup_location: selectedLocation,
        payment_method: "QR",
      });

      // Clear local cart context items
      await fetchCart();

      // Navigate to demo payment page
      navigate(`/payment/${res.data.orderId}`);
    } catch (err: any) {
      console.error("Checkout failed:", err);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.response?.data?.error || "Order submission failed",
        confirmButtonColor: "#f97316"
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 mt-10 lg:mt-36 mb-20 font-sans min-h-[50vh]">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Checkout (Pick-up)</h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading checkout info...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <form onSubmit={handleSubmit} id="checkout-form">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <i className="fa-solid fa-store text-orange-500"></i> Select Store
                </h2>

                <div className="space-y-3">
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <label
                        key={loc.id}
                        className={`flex items-center p-4 border rounded-xl cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 transition ${
                          selectedLocation === loc.name
                            ? "border-orange-500 bg-orange-50 dark:bg-gray-700"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pickup_location"
                          value={loc.name}
                          checked={selectedLocation === loc.name}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          required
                          className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="ml-4">
                          <span className="block font-bold text-gray-900 dark:text-white">
                            {loc.name}
                          </span>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">
                            {loc.address}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-red-500">No stores available. Please contact admin.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0 || !selectedLocation}
                className="w-full mt-8 bg-orange-500 disabled:opacity-50 text-white py-4 rounded-full font-bold text-lg hover:bg-orange-600 shadow-lg transition transform hover:-translate-y-1"
              >
                {submitting ? "Processing..." : "Confirm Order"}
              </button>
            </form>
          </div>

          <div className="md:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl sticky top-24 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Order Summary</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.cart_id}
                    className="flex justify-between text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">{item.price * item.quantity} $</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 flex justify-between font-bold text-xl text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-orange-600 dark:text-orange-400">
                  {cartTotal.toLocaleString()} $
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
