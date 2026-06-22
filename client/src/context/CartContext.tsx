import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export interface CartItem {
  cart_id: number;
  product_id: string | number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  isOpen: boolean;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string | number) => Promise<{ success: boolean; error?: string }>;
  updateQty: (cartId: number, action: "increment" | "decrement") => Promise<void>;
  deleteCartItem: (cartId: number) => Promise<void>;
  cartCount: number;
  cartTotal: number;
  showStaffTicket: boolean;
  toggleStaffTicket: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || "";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showStaffTicket, setShowStaffTicket] = useState<boolean>(true);

  const toggleStaffTicket = () => {
    setShowStaffTicket(!showStaffTicket);
  };

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/cart`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const toggleCart = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchCart();
    }
  };

  const addToCart = async (productId: string | number) => {
    if (!isAuthenticated) {
      return { success: false, error: "unauthorized" };
    }
    try {
      const res = await axios.post(`${API_BASE}/api/cart`, { productId });
      await fetchCart();
      return { success: true };
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      return { success: false, error: err.response?.data?.error || "Error adding item" };
    }
  };

  const updateQty = async (cartId: number, action: "increment" | "decrement") => {
    try {
      await axios.patch(`${API_BASE}/api/cart/${cartId}`, { action });
      await fetchCart();
    } catch (err) {
      console.error("Error updating cart quantity:", err);
    }
  };

  const deleteCartItem = async (cartId: number) => {
    try {
      await axios.delete(`${API_BASE}/api/cart/${cartId}`);
      await fetchCart();
    } catch (err) {
      console.error("Error deleting cart item:", err);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        isOpen,
        toggleCart,
        fetchCart,
        addToCart,
        updateQty,
        deleteCartItem,
        cartCount,
        cartTotal,
        showStaffTicket,
        toggleStaffTicket,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
