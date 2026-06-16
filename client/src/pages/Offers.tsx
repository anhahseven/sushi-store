import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { CardSkeleton, OfferBannerSkeleton } from "../components/ui/Skeleton";

interface DiscountProduct {
  id: string | number;
  name: string;
  price: number;
  image_url: string;
  discount_type: "percentage" | "subtract" | "none";
  discount_value: number;
}

export const Offers: React.FC = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<DiscountProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<string>("");

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/offers`);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching offers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleAddToCart = async (productId: string | number) => {
    if (!isAuthenticated) {
      const loginConfirm = window.confirm("Please login to add items to your cart. Login now?");
      if (loginConfirm) {
        navigate("/login");
      }
      return;
    }
    const res = await addToCart(productId);
    if (!res.success) {
      alert(res.error || "Failed to add item to cart");
    } else {
      showToastNotification("Added to Cart! 🛒");
    }
  };

  const showToastNotification = (msg: string) => {
    setCopyStatus(msg);
    setTimeout(() => setCopyStatus(""), 3000);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToastNotification(`Code ${code} Copied!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mt-36 font-sans pb-16 min-h-screen">
      {/* Toast Notification Container */}
      {copyStatus && (
        <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
          <div
            className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-white/20"
            style={{ animation: "slideIn 0.5s forwards" }}
          >
            <div className="text-2xl">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div className="font-bold">{copyStatus}</div>
          </div>
        </div>
      )}

      <section className="mb-6 md:mb-10">
        <div className="text-center mb-10">
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Deals of the Week
          </span>
          <h1 className="text-4xl font-extrabold mt-4 mb-2 text-gray-900 dark:text-white">
            Exclusive Offers
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Save on your favorite sets. Offers valid until Sunday.
          </p>
        </div>

        {/* Hero banner deal */}
        {loading ? (
          <OfferBannerSkeleton />
        ) : (
          <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-12 group shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Sushi Platter"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center px-8 md:px-16">
              <div className="text-white max-w-lg">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">50% OFF Second Set</h2>
                <p className="mb-6 opacity-90">
                  Order any Dragon Set and get the second one half price. Perfect for sharing.
                </p>
                <a
                  href="#deals"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:translate-y-[-2px] inline-block"
                >
                  Order Now
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Deals */}
        <div className="mb-10" id="deals">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center gap-2">
            🔥 Hot Deals & Discounts
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              <CardSkeleton count={3} heightClass="h-[450px]" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {products.map((product) => {
                let finalPrice = Number(product.price);
                let discountLabel = "";

                if (product.discount_type === "percentage") {
                  finalPrice = product.price - product.price * (product.discount_value / 100);
                  discountLabel = `-${product.discount_value}%`;
                } else if (product.discount_type === "subtract") {
                  finalPrice = product.price - product.discount_value;
                  discountLabel = `SAVE $${product.discount_value}`;
                }

                finalPrice = Math.round(finalPrice * 100) / 100;

                return (
                  <div
                    key={product.id}
                    className="group relative h-[450px] w-full rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl product-card border border-gray-100/50 dark:border-gray-800"
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={product.image_url || "https://via.placeholder.com/300"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </div>

                    <div className="absolute top-6 left-6 bg-red-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-md z-20 tracking-wide uppercase animate-pulse">
                      {discountLabel} OFF
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex items-end justify-between">
                      <div className="flex flex-col gap-1 w-3/4">
                        <span className="text-orange-500 text-xs font-extrabold uppercase tracking-widest mb-1">
                          Limited Time Offer
                        </span>
                        <h3 className="text-white text-3xl font-bold leading-tight shadow-black drop-shadow-md product-name mb-3">
                          {product.name}
                        </h3>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                            Special Price
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-white text-3xl font-bold">{finalPrice} $</span>
                            <span className="text-gray-400 text-lg line-through decoration-red-500 decoration-2">
                              {product.price} $
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-500 transition-all duration-300 transform group-hover:scale-105 active:scale-95 group/btn relative overflow-hidden focus:outline-none"
                      >
                        <img
                          src="https://img.icons8.com/3d-fluency/94/shopping-basket.png"
                          alt="Add"
                          className="w-9 h-9 object-contain drop-shadow-sm transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:-rotate-6"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No special product discounts at the moment.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Check out our{" "}
                <Link to="/menu" className="text-orange-500 font-bold hover:underline">
                  Full Menu
                </Link>{" "}
                instead!
              </p>
            </div>
          )}
        </div>

        {/* Coupons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Free Miso Soup</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">On orders over $25</p>
              <div
                className="inline-block bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 px-3 py-1 rounded font-mono text-sm tracking-widest cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => copyCode("MISO25")}
              >
                MISO25
              </div>
            </div>
            <div className="h-20 w-20 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 dark:text-orange-400 font-bold text-xl">
              Free
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">20% Off Lunch</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">11:00 AM - 2:00 PM</p>
              <div
                className="inline-block bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 px-3 py-1 rounded font-mono text-sm tracking-widest cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => copyCode("LUNCH20")}
              >
                LUNCH20
              </div>
            </div>
            <div className="h-20 w-20 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 dark:text-orange-400 font-bold text-xl">
              -20%
            </div>
          </div>
        </div>
      </section>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
