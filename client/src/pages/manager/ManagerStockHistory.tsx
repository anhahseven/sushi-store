import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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


interface StockLog {
  id: number;
  report_date: string;
  location_name: string;
  user_id: number | string;
  email: string | null;
  is_unlocked: boolean;
  created_at: string;
}

interface Location {
  id: number;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function ManagerStockHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState<StockLog[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter) params.date = dateFilter;
      if (locationFilter) params.location = locationFilter;

      const res = await axios.get(`${API_BASE}/api/manager/stock-history`, { params, withCredentials: true });
      setLogs(res.data.logs || []);
      setLocations(res.data.locations || []);
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error loading stock history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateFilter, locationFilter]);

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
    if (dateFilter) newParams.date = dateFilter;
    if (locationFilter) newParams.location = locationFilter;
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setDateFilter("");
    setLocationFilter("");
    setSearchParams({});
  };

  const handleToggleLock = async (id: number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Toggle Lock?",
      text: "Change edit permission for this report?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, proceed",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(`${API_BASE}/api/manager/daily-stock/toggle-lock/${id}`, {}, { withCredentials: true });
      showNotification("Permission Updated", "success");
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error updating lock", "error");
    }
  };

  const handleDeleteLog = async (id: number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/manager/daily-stock/${id}`, { withCredentials: true });
      Swal.fire({
        title: "Deleted!",
        text: "The stock report has been deleted.",
        icon: "success",
        background: isDark ? "#111827" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error deleting report", "error");
    }
  };

  const isHeadManagerOrAdmin = user && ["admin", "manager", "demo"].includes(user.role.trim().toLowerCase());

  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
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
          value={locationFilter || "all-locations"}
          onValueChange={(val) => {
            const actualVal = val === "all-locations" ? "" : val;
            setLocationFilter(actualVal);
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

        {(dateFilter || locationFilter) && (
          <button
            type="button"
            onClick={() => {
              setDateFilter("");
              setLocationFilter("");
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
  }, [dateFilter, locationFilter, locations, setHeaderContent, setSearchParams]);

  return (
    <div className="w-full my-6 space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-405">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 font-bold">
              <tr>
                <th scope="col" className="px-6 py-4">
                  Report Date
                </th>
                <th scope="col" className="px-6 py-4">
                  Location
                </th>
                <th scope="col" className="px-6 py-4">
                  Submitted By
                </th>
                <th scope="col" className="px-6 py-4 text-center">
                  Log ID
                </th>
                <th scope="col" className="px-6 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading stock history...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const createdTime = new Date(log.created_at).getTime();
                  const currentTime = new Date().getTime();
                  const diffMinutes = (currentTime - createdTime) / 1000 / 60;

                  const isOwner = user && String(user.id) === String(log.user_id);
                  const isManager = isHeadManagerOrAdmin;

                  // Can Edit IF: (Is Manager) OR (Is Owner AND (Time < 5min OR Unlocked))
                  const canEdit = isManager || (isOwner && (diffMinutes <= 5 || log.is_unlocked));

                  return (
                    <tr
                      key={log.id}
                      className="bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {new Date(log.report_date).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 py-1 px-3 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900">
                          {log.location_name}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-850 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <span>{log.email ? log.email.split("@")[0] : "Unknown"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-gray-400 dark:text-gray-500">#{log.id}</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/manager/daily-stock/view/${log.id}`}
                            className="text-gray-450 hover:text-indigo-650 dark:hover:text-indigo-400 transition"
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye text-lg"></i>
                          </Link>

                          {isManager && (
                            <button
                              onClick={() => handleToggleLock(log.id)}
                              className={`text-xs px-2.5 py-1 rounded border transition flex items-center gap-1 ${
                                log.is_unlocked
                                  ? "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                                  : "border-gray-300 text-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                              }`}
                              title={log.is_unlocked ? "Lock Report" : "Grant Edit Permission"}
                            >
                              {log.is_unlocked ? (
                                <>
                                  <i className="fa-solid fa-lock-open"></i> <span>Open</span>
                                </>
                              ) : (
                                <>
                                  <i className="fa-solid fa-lock"></i> <span>Lock</span>
                                </>
                              )}
                            </button>
                          )}

                          {canEdit && (
                            <>
                              <Link
                                to={`/manager/daily-stock/edit/${log.id}`}
                                className="text-gray-450 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                title="Edit"
                              >
                                <i className="fa-solid fa-pen text-lg"></i>
                              </Link>

                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="text-gray-450 hover:text-red-600 dark:hover:text-red-400 transition"
                                title="Delete"
                              >
                                <i className="fa-solid fa-trash text-lg"></i>
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-regular fa-folder-open text-3xl opacity-50"></i>
                      <p>No stock history found for this selection.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/30 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Showing recent logs</span>
        </div>
      </div>
    </div>
  );
}
