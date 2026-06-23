import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useHeader } from "../../context/HeaderContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface Order {
  id: number;
  created_at: string;
  table_number: string | null;
  user_name: string | null;
  email: string | null;
  pickup_location: string;
  location_address: string | null;
  total_price: string | number;
  status: string;
}

interface Location {
  id: number;
  name: string;
  address: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterDate, setFilterDate] = useState(searchParams.get("date") || "");
  const [filterLocation, setFilterLocation] = useState(searchParams.get("location") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterDate) params.date = filterDate;
      if (filterLocation) params.location = filterLocation;
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get(`${API_BASE}/api/admin/orders`, { params, withCredentials: true });
      setOrders(res.data.orders || []);
      setLocations(res.data.locations || []);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      showNotification(err.response?.data?.error || "Error loading orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterDate, filterLocation, filterStatus]);

  // Handle URL notifications on mount
  useEffect(() => {
    const status = searchParams.get("status_msg");
    const error = searchParams.get("error");
    const msg = searchParams.get("msg");

    if (status === "success") {
      showNotification("Operation Successful!", "success");
    }
    if (error) {
      showNotification(decodeURIComponent(error), "error");
    }
    if (msg) {
      const decoded = decodeURIComponent(msg);
      if (decoded.toLowerCase().includes("completed")) {
        showNotification("Order completed successfully", "success");
      } else if (decoded.toLowerCase().includes("cancelled")) {
        showNotification("Order cancelled successfully", "success");
      }
    }
  }, [searchParams]);

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

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: Record<string, string> = {};
    if (filterDate) newParams.date = filterDate;
    if (filterLocation) newParams.location = filterLocation;
    if (filterStatus) newParams.status = filterStatus;
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterLocation("");
    setFilterStatus("");
    setSearchParams({});
  };

  const confirmAction = async (title: string, apiCall: () => Promise<void>) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, proceed",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (result.isConfirmed) {
      try {
        await apiCall();
        fetchOrders();
      } catch (err: any) {
        console.error(err);
        showNotification(err.response?.data?.error || "Operation failed", "error");
      }
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await confirmAction(`Change Order Status to ${status}?`, async () => {
      await axios.patch(`${API_BASE}/api/admin/orders/${id}/status`, { status }, { withCredentials: true });
      showNotification(`Order status updated to ${status}`, "success");
    });
  };

  const handleRequest = async (id: number, action: string, actionLabel: string) => {
    await confirmAction(`${actionLabel} Request?`, async () => {
      await axios.post(`${API_BASE}/api/admin/orders/handle-request/${id}`, { action }, { withCredentials: true });
      showNotification(`Request processed successfully`, "success");
    });
  };

  const handleDeleteOrder = async (id: number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Delete Order?",
      text: "This action will delete the order. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete order",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/api/admin/orders/delete/${id}`, { withCredentials: true });
        showNotification("Order deleted successfully", "success");
        fetchOrders();
      } catch (err: any) {
        console.error(err);
        showNotification(err.response?.data?.error || "Failed to delete order", "error");
      }
    }
  };

  const checkoutOrder = async (orderId: number, amount: string | number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: `Checkout Order #${orderId}`,
      text: `Total Amount to Pay: $${Number(amount).toFixed(2)}`,
      icon: "info",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: "#10b981", // Emerald Green for Cash
      denyButtonColor: "#ef4444",    // Red for ABA QR
      cancelButtonColor: "#6b7280",  // Gray for Cancel
      confirmButtonText: '<i class="fa-solid fa-money-bill-wave"></i> Cash',
      denyButtonText: '<i class="fa-solid fa-qrcode"></i> ABA QR',
      cancelButtonText: "Cancel",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (result.isConfirmed) {
      processPayment(orderId, "Cash");
    } else if (result.isDenied) {
      processPayment(orderId, "QR");
    }
  };

  const processPayment = async (orderId: number, method: "Cash" | "QR") => {
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
        `${API_BASE}/api/staff/checkout/${orderId}`,
        { payment_method: method },
        { withCredentials: true }
      );

      if (res.data.success) {
        if (res.data.method === "QR") {
          // Redirect to ABA QR Page
          window.location.href = res.data.redirectUrl;
        } else {
          // Success for Cash
          Swal.fire({
            title: "Paid!",
            text: "Order completed successfully with Cash.",
            icon: "success",
            confirmButtonColor: "#10b981",
            background: isDark ? "#111827" : "#fff",
            color: isDark ? "#fff" : "#000",
            customClass: { popup: "rounded-2xl shadow-xl font-sans" },
          }).then(() => {
            fetchOrders();
          });
        }
      } else {
        Swal.fire("Error", res.data.error || "Failed to process payment", "error");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.error || "Connection failed. Please check your internet.", "error");
    }
  };

  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setSearchParams(prev => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set("date", e.target.value);
              else next.delete("date");
              return next;
            });
          }}
          className="px-2.5 py-1.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-auto shrink-0"
        />

        <Select
          value={filterLocation || "all-locations"}
          onValueChange={(val) => {
            const actualVal = val === "all-locations" ? "" : val;
            setFilterLocation(actualVal);
            setSearchParams(prev => {
              const next = new URLSearchParams(prev);
              if (actualVal) next.set("location", actualVal);
              else next.delete("location");
              return next;
            });
          }}
        >
          <SelectTrigger className="px-2.5 py-1.5 h-8 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-[150px] flex-1 sm:flex-none pr-8 shrink-0 flex items-center justify-between">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
            <SelectItem value="all-locations">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.name}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus || "all-statuses"}
          onValueChange={(val) => {
            const actualVal = val === "all-statuses" ? "" : val;
            setFilterStatus(actualVal);
            setSearchParams(prev => {
              const next = new URLSearchParams(prev);
              if (actualVal) next.set("status", actualVal);
              else next.delete("status");
              return next;
            });
          }}
        >
          <SelectTrigger className="px-2.5 py-1.5 h-8 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-750 dark:text-white focus:outline-none shadow-sm transition-colors w-full sm:w-[150px] flex-1 sm:flex-none pr-8 shrink-0 flex items-center justify-between">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
            <SelectItem value="all-statuses">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancel Requested">Cancel Requested</SelectItem>
            <SelectItem value="Refund Requested">Refund Requested</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>


        {(filterDate || filterLocation || filterStatus) && (
          <button
            type="button"
            onClick={() => {
              setFilterDate("");
              setFilterLocation("");
              setFilterStatus("");
              setSearchParams({});
            }}
            className="px-3 py-1.5 text-xs font-bold bg-gray-150 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-lg transition-all"
          >
            Clear
          </button>
        )}
      </div>
    );
    return () => setHeaderContent(null);
  }, [filterDate, filterLocation, filterStatus, locations, setHeaderContent, setSearchParams]);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">Order Management</h3>
          <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-1 rounded">
            Total: {orders.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-sm">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Table</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Store</th>
                <th className="p-4">Address</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <i className="fa-solid fa-spinner fa-spin"></i> Loading orders...
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const isRequested = order.status === "Cancel Requested" || order.status === "Refund Requested";
                  return (
                    <tr
                      key={order.id}
                      className={`${
                        isRequested
                          ? "bg-orange-50/50 dark:bg-orange-950/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      } transition-colors border-gray-100 dark:border-gray-800`}
                    >
                      <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-450">#{order.id}</td>

                      <td className="p-4 text-xs font-bold text-gray-600 dark:text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                        <span className="block font-normal text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {order.table_number ? (
                          <span className="bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded text-xs">
                            Table {order.table_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs italic">Takeout</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          {order.user_name ? (
                            <span className="font-bold text-sm text-gray-800 dark:text-white">{order.user_name}</span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-450 italic">
                              {order.email || "Guest"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-sm text-gray-800 dark:text-gray-300">{order.pickup_location}</td>
                      <td className="p-4 text-sm text-gray-800 dark:text-gray-300">{order.location_address || "N/A"}</td>

                      <td className="p-4 font-bold text-gray-800 dark:text-white">
                        {Number(order.total_price).toFixed(2)} $
                      </td>

                      <td className="p-4">
                        {order.status === "Pending" && (
                          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                            <i className="fa-regular fa-clock"></i> Pending
                          </span>
                        )}
                        {order.status === "Completed" && (
                          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                            <i className="fa-solid fa-check"></i> Completed
                          </span>
                        )}
                        {order.status === "Processing" && (
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                            <i className="fa-solid fa-spinner fa-spin"></i> Processing
                          </span>
                        )}
                        {order.status === "Cancel Requested" && (
                          <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 animate-pulse">
                            <i className="fa-solid fa-ban"></i> Cancel Req
                          </span>
                        )}
                        {order.status === "Refund Requested" && (
                          <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 animate-pulse">
                            <i className="fa-solid fa-rotate-left"></i> Refund Req
                          </span>
                        )}
                        {order.status === "Cancelled" && (
                          <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                            <i className="fa-solid fa-ban"></i> Cancelled
                          </span>
                        )}
                        {order.status === "Refunded" && (
                          <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1">
                            <i className="fa-solid fa-rotate-left"></i> Refunded
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2 items-center">
                          {order.status !== "Completed" && order.status !== "Cancelled" && order.status !== "Refunded" && (
                            <button
                              type="button"
                              onClick={() => checkoutOrder(order.id, order.total_price)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 shrink-0"
                            >
                              <i className="fa-solid fa-cash-register"></i> Pay
                            </button>
                          )}

                          {order.status === "Cancel Requested" && (
                            <>
                              <button
                                onClick={() => handleRequest(order.id, "approve_cancel", "Approve Cancel")}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm transition shrink-0"
                              >
                                <i className="fa-solid fa-check mr-1"></i> Accept Cancel
                              </button>
                              <button
                                onClick={() => handleRequest(order.id, "reject_cancel", "Reject Cancel")}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition shrink-0"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {order.status === "Refund Requested" && (
                            <>
                              <button
                                onClick={() => handleRequest(order.id, "approve_refund", "Approve Refund")}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition shrink-0"
                              >
                                <i className="fa-solid fa-check mr-1"></i> Accept Refund
                              </button>
                              <button
                                onClick={() => handleRequest(order.id, "reject_refund", "Reject Refund")}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition shrink-0"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {order.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(order.id, "Completed")}
                                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold transition shadow-sm shrink-0"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(order.id, "Cancelled")}
                                className="px-3 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 dark:bg-transparent dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-lg text-xs font-bold transition shadow-sm shrink-0"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="px-2 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition shrink-0"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>

                              <Link
                                to={`/admin/orders/edit/${order.id}`}
                                className="px-3 py-1.5 text-gray-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition shrink-0"
                              >
                                <i className="fa-solid fa-pen-to-square text-lg"></i>
                              </Link>
                            </>
                          )}

                          {order.status !== "Pending" &&
                            order.status !== "Cancel Requested" &&
                            order.status !== "Refund Requested" && (
                              <>
                                <Link
                                  to={`/admin/orders/edit/${order.id}`}
                                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition flex items-center shrink-0"
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                </Link>

                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition shrink-0"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No orders found.
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
