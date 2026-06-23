import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useHeader } from "../../context/HeaderContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface StockItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  image_url: string | null;
  quantity: number;
}

interface StockRequest {
  id: number;
  created_at: string;
  location_name: string;
  status: string;
  email: string | null;
}

interface Location {
  id: number;
  name: string;
}

interface CartItem extends StockItem {
  requestQuantity: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminStockOrders() {
  const { setHeaderContent } = useHeader();
  const { user } = useAuth();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and Search states for inventory
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const isStoreManager = user?.role?.trim().toLowerCase() === "store_manager";

  useEffect(() => {
    if (isStoreManager) {
      setHeaderContent(
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-755 dark:text-white focus:outline-none shadow-sm transition-colors placeholder-gray-400"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val)}
          >
            <SelectTrigger className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-750 dark:text-white rounded-lg px-2.5 py-1.5 h-8 focus:outline-none shadow-sm transition-colors w-full sm:w-[150px] flex-1 sm:flex-none pr-8 shrink-0 flex items-center justify-between">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Cook">Cook</SelectItem>
              <SelectItem value="Drink">Drink</SelectItem>
              <SelectItem value="Supplies">Supplies</SelectItem>
              <SelectItem value="Packaging">Packaging</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    } else {
      setHeaderContent(null);
    }
    return () => setHeaderContent(null);
  }, [isStoreManager, searchTerm, selectedCategory, setHeaderContent]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Item quantities input map
  const [inputQuantities, setInputQuantities] = useState<Record<number, string>>({});

  const fetchStockData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stock`, { withCredentials: true });
      setRequests(res.data.requests || []);
      setLocations(res.data.locations || []);
      setStocks(res.data.stocks || []);
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error loading stock requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
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

  // Find user's assigned store name
  const getUserStoreName = () => {
    if (!user || !user.assigned_location_id) return "My Assigned Store";
    const found = locations.find((l) => l.id === user.assigned_location_id);
    return found ? found.name : "My Assigned Store";
  };

  // Cart methods
  const handleQuantityInputChange = (itemId: number, val: string) => {
    setInputQuantities((prev) => ({ ...prev, [itemId]: val }));
  };

  const handleAddToCart = (item: StockItem) => {
    const qtyStr = inputQuantities[item.id];
    const qty = parseInt(qtyStr || "0");

    if (!qty || qty <= 0) {
      showNotification("Please enter a valid quantity", "error");
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].requestQuantity += qty;
        return updated;
      } else {
        return [...prevCart, { ...item, requestQuantity: qty }];
      }
    });

    setInputQuantities((prev) => ({ ...prev, [item.id]: "" }));
    showNotification("Added to Cart!", "success");
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitRequest = async () => {
    const locName = getUserStoreName();
    if (locName === "My Assigned Store") {
      showNotification("Please assign a location to this user first", "error");
      return;
    }
    if (cart.length === 0) {
      showNotification("Cart is empty", "error");
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    Swal.fire({
      title: "Processing...",
      allowOutsideClick: false,
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await axios.post(
        `${API_BASE}/api/stock/create`,
        {
          location_name: locName,
          items: cart.map((i) => ({
            name: i.name,
            category: i.category,
            quantity: i.requestQuantity,
          })),
        },
        { withCredentials: true }
      );

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          title: "Success!",
          text: "Request Sent Successfully!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: isDark ? "#111827" : "#fff",
          color: isDark ? "#fff" : "#000",
        });
        setCart([]);
        fetchStockData();
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Failed to submit request", "error");
    }
  };

  // Status updates
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    let title = "Are you sure?";
    let text = "Do you want to proceed with this action?";
    let confirmBtnColor = "#3085d6";

    if (newStatus.includes("Cancel")) {
      text = "You are about to cancel this request.";
      confirmBtnColor = "#d33";
    }
    if (newStatus === "Confirmed") {
      title = "Approve Request?";
      text = "This will mark the request as approved.";
      confirmBtnColor = "#10b981";
    }
    if (newStatus.includes("Refund")) {
      title = "Process Refund?";
      confirmBtnColor = "#3b82f6";
    }

    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmBtnColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, do it!",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (result.isConfirmed) {
      try {
        await axios.post(
          `${API_BASE}/api/stock/update-status/${id}`,
          { status: newStatus },
          { withCredentials: true }
        );
        Swal.fire({
          title: "Updated!",
          text: "The status has been updated.",
          icon: "success",
          background: isDark ? "#111827" : "#fff",
          color: isDark ? "#fff" : "#000",
        });
        fetchStockData();
      } catch (err: any) {
        console.error(err);
        showNotification(err.response?.data?.error || "Error updating status", "error");
      }
    }
  };

  const isAdminOrManager = ["admin", "manager", "demo"].includes(user?.role?.trim().toLowerCase() || "");

  // Filtered inventory
  const filteredStocks = stocks.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      {isStoreManager && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-160px)] gap-4 overflow-hidden mb-6">
          {/* Master Inventory Left */}
          <div className="w-full lg:w-[70%] bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full transition-colors overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-805 dark:text-white">Master Inventory</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Select items to request from the warehouse</p>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <i className="fa-solid fa-store absolute left-3 top-3 text-gray-400"></i>
                    <input
                      type="text"
                      value={getUserStoreName()}
                      disabled
                      className="pl-9 w-full bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 text-sm font-bold text-gray-600 dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Items Grid */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 dark:bg-gray-950 transition-colors">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-10 text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
                  </div>
                ) : filteredStocks.length > 0 ? (
                  filteredStocks.map((item) => (
                    <div
                      key={item.id}
                      className="product-card bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition group relative"
                    >
                      <div className="h-28 w-full bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden relative">
                        <img
                          src={item.image_url || "https://via.placeholder.com/150?text=No+Img"}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          alt={item.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Img";
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 dark:text-gray-300 shadow-sm">
                          {item.category}
                        </div>
                      </div>

                      <h4 className="font-bold text-gray-805 dark:text-white text-sm truncate mb-3">{item.name}</h4>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={inputQuantities[item.id] || ""}
                          onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-850 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-2 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition shadow-lg shrink-0"
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-400">
                    <i className="fa-solid fa-box-open text-4xl mb-3"></i>
                    <p>No items in Master Inventory.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Request Cart Right */}
          <div className="w-full lg:w-[30%] bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-full transition-colors overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-cart-shopping text-indigo-650 dark:text-indigo-400"></i> Request Cart
                {cart.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 p-10 text-center">
                  <i className="fa-solid fa-basket-shopping text-5xl mb-4 text-gray-200 dark:text-gray-800"></i>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Cart is empty</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Add items from the left to start.</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-250 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image_url || "https://via.placeholder.com/50"}
                        className="w-10 h-10 rounded-md object-cover bg-gray-100 dark:bg-gray-750 shrink-0"
                        alt={item.name}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 dark:text-white">{item.name}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {item.requestQuantity} {item.unit}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(index)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 shrink-0">
              <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-600 dark:text-gray-300">
                <span>Total Items:</span>
                <span className="text-indigo-650 dark:text-indigo-400">{cart.length}</span>
              </div>
              <button
                onClick={handleSubmitRequest}
                disabled={cart.length === 0}
                className={`w-full py-3 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                  cart.length === 0
                    ? "bg-gray-300 dark:bg-gray-800 cursor-not-allowed text-gray-500"
                    : "bg-indigo-650 hover:bg-indigo-755 shadow-lg shadow-indigo-500/20"
                }`}
              >
                <span>Submit Request</span>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request History Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Request History</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Track and manage stock requests</p>
          </div>
          <button onClick={fetchStockData} className="text-indigo-650 dark:text-indigo-400 text-sm font-bold hover:underline">
            <i className="fa-solid fa-rotate-right"></i> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-450 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && !isStoreManager ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading stock requests...
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4 font-mono text-gray-500">#{req.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-white">
                      {new Date(req.created_at).toLocaleDateString()}
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">
                        {new Date(req.created_at).toLocaleTimeString()}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-600 dark:text-gray-300">
                      {req.location_name || "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      {req.status === "Pending" && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                          <i className="fa-regular fa-clock"></i> Pending
                        </span>
                      )}
                      {req.status === "Confirmed" && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                          <i className="fa-solid fa-check"></i> Approved
                        </span>
                      )}
                      {req.status === "Cancel Requested" && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 animate-pulse">
                          <i className="fa-solid fa-ban"></i> Cancel Requested
                        </span>
                      )}
                      {req.status === "Refund Requested" && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 animate-pulse">
                          <i className="fa-solid fa-rotate-left"></i> Refund Requested
                        </span>
                      )}
                      {req.status === "Cancelled" && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                          <i className="fa-solid fa-ban"></i> Cancelled
                        </span>
                      )}
                      {req.status === "Refunded" && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                          <i className="fa-solid fa-rotate-left"></i> Refunded
                        </span>
                      )}
                      {req.status !== "Pending" &&
                        req.status !== "Confirmed" &&
                        req.status !== "Cancel Requested" &&
                        req.status !== "Refund Requested" &&
                        req.status !== "Cancelled" &&
                        req.status !== "Refunded" && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                            <i className="fa-solid fa-xmark"></i> Rejected
                          </span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isStoreManager && (
                          <>
                            {req.status === "Pending" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "Cancel Requested")}
                                className="bg-red-50 text-red-650 border border-red-200 hover:bg-red-100 dark:bg-transparent dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0"
                              >
                                Request Cancel
                              </button>
                            )}
                            {req.status === "Confirmed" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "Refund Requested")}
                                className="bg-blue-50 text-blue-650 border border-blue-200 hover:bg-blue-100 dark:bg-transparent dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-955/20 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0"
                              >
                                Request Refund
                              </button>
                            )}
                          </>
                        )}

                        {isAdminOrManager && (
                          <>
                            {req.status === "Pending" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "Confirmed")}
                                className="bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0"
                              >
                                Approve
                              </button>
                            )}

                            {req.status === "Cancel Requested" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "Cancelled")}
                                className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0"
                              >
                                Accept Cancel
                              </button>
                            )}

                            {req.status === "Refund Requested" && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "Refunded")}
                                className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0"
                              >
                                Accept Refund
                              </button>
                            )}

                            {(req.status === "Pending" || req.status === "Confirmed") && (
                              <button
                                onClick={() => handleUpdateStatus(req.id, "Cancelled")}
                                className="bg-white border border-red-200 text-red-500 hover:bg-red-50 dark:bg-transparent dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}

                        <Link
                          to={`/admin/stock/request/${req.id}`}
                          className="text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition p-2 shrink-0"
                        >
                          <i className="fa-solid fa-eye text-lg"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
