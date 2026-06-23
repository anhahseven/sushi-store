import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useHeader } from "../../context/HeaderContext";


interface UserAccount {
  id: number;
  email: string;
  role: string;
  assigned_location_id: number | null;
}

interface Location {
  id: number;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { setHeaderContent } = useHeader();

  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [assignedLocationId, setAssignedLocationId] = useState("");


  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, { withCredentials: true });
      setUsersList(res.data.usersList || []);
      setLocations(res.data.locations || []);
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error loading users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    setHeaderContent(
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-48">
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] rounded-lg text-xs font-semibold text-gray-755 dark:text-white focus:outline-none shadow-sm transition-colors placeholder-gray-400"
          />
        </div>
      </div>
    );
    return () => setHeaderContent(null);
  }, [searchTerm, setHeaderContent]);


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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const locId = ["store_manager", "staff", "cashier"].includes(role) ? Number(assignedLocationId) : null;
      if (["store_manager", "staff", "cashier"].includes(role) && !assignedLocationId) {
        showNotification("Must select an assigned location for this role", "error");
        return;
      }

      await axios.post(
        `${API_BASE}/api/admin/users/create`,
        { email, password, role, assigned_location_id: locId },
        { withCredentials: true }
      );

      showNotification("User Created Successfully!", "success");
      setEmail("");
      setPassword("");
      setRole("user");
      setAssignedLocationId("");
      fetchUsersData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error creating user", "error");
    }
  };

  const handleDeleteUser = async (targetId: number) => {
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "Delete User?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete user",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/users/delete/${targetId}`, { withCredentials: true });
      showNotification("User Deleted!", "success");
      fetchUsersData();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error deleting user", "error");
    }
  };

  const showLocationSelector = ["store_manager", "staff", "cashier"].includes(role);

  const getRoleBadge = (r: string) => {
    const cleanRole = r.trim().toLowerCase();
    switch (cleanRole) {
      case "admin":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
            Admin
          </span>
        );
      case "manager":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
            Head Manager
          </span>
        );
      case "store_manager":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 uppercase tracking-wide">
            Store Manager
          </span>
        );
      case "staff":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 uppercase tracking-wide">
            Staff
          </span>
        );
      case "cashier":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-905/50 text-yellow-750 dark:text-yellow-300 uppercase tracking-wide">
            Cashier
          </span>
        );
      case "demo":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 dark:bg-pink-900/50 text-pink-755 dark:text-pink-300 uppercase tracking-wide">
            Demo (Read-only)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div id="toast-container" className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"></div>

      {/* Creation Box */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <h2 className="text-lg font-bold text-gray-850 dark:text-white mb-4">Create New Staff User</h2>
        <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">EMAIL ADDRESS</label>
            <input
              type="email"
              required
              placeholder="name@store.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-805 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">PASSWORD</label>
            <input
              type="password"
              required
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-805 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="user">User (Standard)</option>
              <option value="staff">Staff (Kitchen/Waiter)</option>
              <option value="cashier">Cashier (Payment)</option>
              <option value="store_manager">Store Manager</option>
              <option value="manager">Head Manager</option>
              <option value="admin">Administrator</option>
              <option value="demo">Demo (Read-only)</option>
            </select>
          </div>

          <div className={`w-full ${showLocationSelector ? "" : "hidden"}`} id="newLocationDiv">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-405 mb-1 text-orange-600 dark:text-orange-400">
              ASSIGN STORE
            </label>
            <select
              value={assignedLocationId}
              onChange={(e) => setAssignedLocationId(e.target.value)}
              required={showLocationSelector}
              className="w-full px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-orange-900 dark:text-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="" disabled>
                -- Select Location --
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <i className="fa-solid fa-check"></i> Create
          </button>
        </form>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading users...
          </div>
        ) : (
          (() => {
            const filtered = usersList.filter(
              (u) =>
                u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return filtered.length > 0 ? (
              filtered.map((u) => (
                <div
                  key={u.id}
                  className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 text-center hover:shadow-md transition-all"
                >
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate" title={u.email}>
                    {u.email}
                  </h3>

                  <div className="my-3">{getRoleBadge(u.role)}</div>

                  <div className="flex justify-center gap-2 mt-4">
                    <Link
                      to={`/admin/users/edit/${u.id}`}
                      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      Edit
                    </Link>

                    {currentUser && currentUser.id !== u.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-105 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/30"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 col-span-3 text-center">No users found matching search query.</p>
            );
          })()
        )}
      </div>
    </div>
  );
}
