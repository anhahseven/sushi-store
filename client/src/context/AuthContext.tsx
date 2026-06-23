import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface User {
  id: string | number;
  email: string;
  role: string;
  assigned_location_id?: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || "";

axios.defaults.withCredentials = true;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/status`);
      if (res.data.authenticated) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { username: email, password });
      return { success: true, role: res.data.role };
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, error: err.response?.data?.error || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    const cleanRole = user.role.trim().toLowerCase();
    if (cleanRole === "demo") return true;
    return roles.map(r => r.trim().toLowerCase()).includes(cleanRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
