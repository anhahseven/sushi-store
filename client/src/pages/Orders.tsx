import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { TableSkeleton } from "../components/ui/skeleton";

interface Order {
  id: number;
  created_at: string;
  pickup_location: string;
  table_number?: string | null;
  payment_method: string;
  total_price: number;
  status: string;
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/orders`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRequestCancel = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await axios.post(`${API_BASE}/api/orders/request-cancel/${orderId}`);
      alert("Cancellation request submitted successfully.");
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Request failed");
    }
  };

  const handleRequestRefund = async (orderId: number) => {
    if (!window.confirm("Request a refund for this order?")) return;
    try {
      await axios.post(`${API_BASE}/api/orders/request-refund/${orderId}`);
      alert("Refund request submitted successfully.");
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Request failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400";
      case "Cancelled":
        return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400";
      case "Refunded":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400";
      case "Processing":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400";
      case "Cancel Requested":
      case "Refund Requested":
        return "bg-orange-100 text-orange-700 border border-orange-200 animate-pulse";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 mb-20 font-sans min-h-[50vh]" style={{ paddingTop: "120px" }}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your order history and status</p>
        </div>
        <Link
          to="/menu"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
        >
          <i className="fa-solid fa-utensils"></i> Order More
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">Order List</h3>
          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">
            {orders.length} Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">
              <tr>
                <th className="p-5">ID</th>
                <th className="p-5">Date</th>
                <th className="p-5">Pickup Location</th>
                <th className="p-5">Payment</th>
                <th className="p-5">Total</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-200"
                  >
                    <td className="p-5 font-mono text-sm text-gray-600 dark:text-gray-400">
                      #{order.id}
                    </td>

                    <td className="p-5 text-sm font-medium text-gray-700 dark:text-white">
                      {new Date(order.created_at).toLocaleDateString()}
                      <span className="text-xs text-gray-400 block font-normal">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    <td className="p-5 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-store text-gray-400"></i>
                        {order.pickup_location}
                      </div>
                      {order.table_number && (
                        <div className="mt-1">
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                            Table {order.table_number}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-5">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          order.payment_method === "QR"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                        }`}
                      >
                        {order.payment_method}
                      </span>
                    </td>

                    <td className="p-5 font-bold text-gray-800 dark:text-white">
                      {Number(order.total_price).toFixed(2)} $
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="p-5 text-right">
                      {order.status === "Pending" ? (
                        <button
                          onClick={() => handleRequestCancel(order.id)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition shadow-sm border border-red-100 dark:border-red-800"
                        >
                          Request Cancel
                        </button>
                      ) : order.status === "Completed" ? (
                        <button
                          onClick={() => handleRequestRefund(order.id)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-red-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition shadow-sm border border-blue-100 dark:border-blue-800"
                        >
                          Request Refund
                        </button>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs italic">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 dark:text-gray-500">
                    <i className="fa-solid fa-basket-shopping text-4xl mb-3 block opacity-20"></i>
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
};
