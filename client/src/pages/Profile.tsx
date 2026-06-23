import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export const Profile: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(user?.email || "");
  const [password, setPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      await axios.put(`${API_BASE}/profile/update`, { email, password });
      await checkAuth();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Profile updated successfully!",
        showConfirmButton: false,
        timer: 1500
      });
      setStatusMsg("Profile updated successfully!");
      setPassword("");
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to update profile.";
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: errMsg,
        confirmButtonColor: "#f97316"
      });
      setErrorMsg(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    Swal.fire({
      title: "Delete Account?",
      text: "Are you absolutely sure you want to delete your account? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete Account",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeleting(true);
        try {
          await axios.delete(`${API_BASE}/profile/delete`);
          await logout();
          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "Your account has been deleted.",
            confirmButtonColor: "#f97316"
          }).then(() => {
            navigate("/");
          });
        } catch (err: any) {
          console.error(err);
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: err.response?.data?.error || "Account deletion failed",
            confirmButtonColor: "#f97316"
          });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto px-6 mt-36 mb-20 font-sans min-h-[50vh]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          {user && (
            <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              Role: {user.role}
            </span>
          )}
        </div>

        {statusMsg && (
          <div className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 p-4 rounded-xl mb-6 font-bold text-sm">
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 font-bold text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-100 dark:bg-gray-750 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 dark:text-white border-0"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-100 dark:bg-gray-750 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 dark:text-white border-0"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-full hover:bg-orange-600 transition shadow-md"
          >
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </form>

        {user?.role === "user" && (
          <div className="border-t border-gray-100 dark:border-gray-700 my-8 pt-8">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition duration-300 shadow-md focus:outline-none"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
