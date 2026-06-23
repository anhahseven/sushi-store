import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

interface Location {
  id: number;
  name: string;
}

interface UserAccount {
  id: number;
  email: string;
  role: string;
  assigned_location_id: number | null;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function AdminEditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [assignedLocationId, setAssignedLocationId] = useState("");

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users/edit/${id}`, { withCredentials: true });
      const target = res.data.targetUser as UserAccount;
      setLocations(res.data.locations || []);

      setEmail(target.email || "");
      setRole(target.role || "user");
      setAssignedLocationId(target.assigned_location_id ? String(target.assigned_location_id) : "");
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.response?.data?.error || "Failed to load user details", "error");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserData();
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

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDark = document.documentElement.classList.contains("dark");

    const result = await Swal.fire({
      title: "Update User?",
      text: "Save changes to this user?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, update user",
      background: isDark ? "#111827" : "#fff",
      color: isDark ? "#fff" : "#000",
      customClass: { popup: "rounded-2xl shadow-xl font-sans" },
    });

    if (!result.isConfirmed) return;

    try {
      const locId = ["store_manager", "staff", "cashier"].includes(role) ? Number(assignedLocationId) : null;
      if (["store_manager", "staff", "cashier"].includes(role) && !assignedLocationId) {
        showNotification("Must select an assigned location for this role", "error");
        return;
      }

      await axios.patch(
        `${API_BASE}/api/admin/users/update/${id}`,
        { email, password, role, assigned_location_id: locId },
        { withCredentials: true }
      );

      showNotification("User Details Updated!", "success");
      setTimeout(() => navigate("/admin/users"), 1000);
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.error || "Error updating user", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <i className="fa-solid fa-spinner fa-spin text-2xl"></i> Loading user details...
        </div>
      </div>
    );
  }

  const showLocationSelector = ["store_manager", "staff", "cashier"].includes(role);

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mt-10 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-808 dark:text-white">Edit User Details</h2>
        <Link to="/admin/users" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-bold">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleUpdateUser} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-805 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
            New Password <span className="text-gray-400 dark:text-gray-550 font-normal lowercase">(Leave blank to keep current)</span>
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-805 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Role Permission</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="user">User (Standard)</option>
            <option value="manager">Head Manager (All Access)</option>
            <option value="staff">Staff (POS Access)</option>
            <option value="cashier">Cashier (Payment)</option>
            <option value="store_manager">Local Store Manager</option>
            <option value="admin">Administrator</option>
            <option value="demo">Demo (Read-only)</option>
          </select>
        </div>

        <div className={showLocationSelector ? "" : "hidden"}>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-405 mb-1 uppercase text-orange-600 dark:text-orange-400">
            Assign Store Location
          </label>
          <select
            value={assignedLocationId}
            onChange={(e) => setAssignedLocationId(e.target.value)}
            required={showLocationSelector}
            className="w-full px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-orange-900 dark:text-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">-- Select Location --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm"
        >
          Update User
        </button>
      </form>
    </div>
  );
}
