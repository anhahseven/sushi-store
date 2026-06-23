import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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


interface RequestItem {
  id: number;
  request_id: number;
  item_name: string;
  category: string;
  quantity: number;
}

interface StockRequest {
  id: number;
  created_at: string;
  location_name: string;
  status: string;
  user_id: number;
}

interface Location {
  id: number;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminViewStockRequest() {
  const { setHeaderContent } = useHeader();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<StockRequest | null>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick filter states (navigates back to stock orders list with filters)
  const [filterDate, setFilterDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const handleFilterChange = (date: string, location: string) => {
    const queryParts: string[] = [];
    if (date) queryParts.push(`date=${date}`);
    if (location) queryParts.push(`location=${location}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    navigate(`/admin/stock${queryString}`);
  };

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center gap-2 text-xs font-semibold w-full sm:w-auto">
        <span className="text-gray-450 dark:text-zinc-500 uppercase text-[10px] tracking-wider shrink-0 hidden sm:inline">Filter List:</span>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            handleFilterChange(e.target.value, filterLocation);
          }}
          className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 text-gray-750 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none shadow-sm transition-colors text-xs shrink-0 w-full sm:w-auto"
        />
        <Select
          value={filterLocation || "all-locations"}
          onValueChange={(val) => {
            const actualVal = val === "all-locations" ? "" : val;
            setFilterLocation(actualVal);
            handleFilterChange(filterDate, actualVal);
          }}
        >
          <SelectTrigger className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 text-gray-750 dark:text-white rounded-lg px-2.5 py-1.5 h-8 focus:outline-none shadow-sm transition-colors text-xs shrink-0 w-full sm:w-[150px] flex-1 sm:flex-none pr-8 flex items-center justify-between">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg text-xs font-semibold">
            <SelectItem value="all-locations">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
    return () => setHeaderContent(null);
  }, [filterDate, filterLocation, locations, setHeaderContent]);

  const fetchRequestDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stock/request/${id}`, { withCredentials: true });
      setRequest(res.data.request);
      setItems(res.data.items || []);
      setLocations(res.data.locations || []);
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.error || "Failed to load request details", "error");
      navigate("/admin/stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

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


  const handleStatusUpdate = async (status: string) => {
    const isDark = document.documentElement.classList.contains("dark");
    if (status === "Rejected") {
      const result = await Swal.fire({
        title: "Reject Request?",
        text: "Are you sure you want to reject this request?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, reject it",
        background: isDark ? "#111827" : "#fff",
        color: isDark ? "#fff" : "#000",
        customClass: { popup: "rounded-2xl shadow-xl font-sans" },
      });
      if (!result.isConfirmed) return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/stock/update-status/${id}`,
        { status },
        { withCredentials: true }
      );
      const msg = status === "Confirmed" ? "Request Approved!" : "Request Rejected";
      showNotification(msg, status === "Confirmed" ? "success" : "error");
      fetchRequestDetails();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error updating status", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <i className="fa-solid fa-spinner fa-spin text-2xl"></i> Loading request details...
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Request not found</p>
        <Link to="/admin/stock" className="text-indigo-650 dark:text-indigo-400 hover:underline">
          Back to List
        </Link>
      </div>
    );
  }

  const isAdminOrManager = user && ["admin", "manager", "demo"].includes(user.role.trim().toLowerCase());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      {/* Main Request Display */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-850 dark:text-white flex items-center gap-3">
              Request #{request.id}
              {request.created_at && (
                <span className="text-xs font-normal bg-gray-100 dark:bg-gray-800 text-gray-550 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                  <i className="fa-regular fa-calendar mr-1"></i>
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              )}
            </h2>
            <p className="text-gray-550 dark:text-gray-400 mt-1">
              Location: <span className="font-bold text-indigo-650 dark:text-indigo-400">{request.location_name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Status: <span className="font-bold">{request.status}</span>
            </p>
          </div>
          <Link
            to="/admin/stock"
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-sm font-medium flex items-center gap-1"
          >
            <i className="fa-solid fa-arrow-left"></i> Back to List
          </Link>
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Requested Items</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Item Name</th>
                <th className="p-3 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item.id} className="dark:text-gray-350">
                  <td className="p-3">
                    {item.category === "Cook" ? (
                      <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-1 rounded text-xs font-bold">
                        Cook
                      </span>
                    ) : (
                      <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{item.item_name}</td>
                  <td className="p-3 text-right font-bold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isAdminOrManager && request.status === "Pending" && (
          <div className="flex gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
            <button
              onClick={() => handleStatusUpdate("Confirmed")}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <i className="fa-solid fa-check"></i> Approve Request
            </button>

            <button
              onClick={() => handleStatusUpdate("Rejected")}
              className="flex-1 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-650 dark:text-red-400 font-bold rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-xmark"></i> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
