import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { CategorySkeleton, CardSkeleton } from "../components/ui/Skeleton";

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  image_url: string;
  is_best_seller?: boolean;
}

interface Category {
  id: number;
  name: string;
}

export const Menu: React.FC = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [categories]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/menu`);
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error fetching menu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
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
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const displayCategories = [{ id: 0, name: "All" }, ...categories];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-24 lg:mt-36 font-sans min-h-screen pb-16">
      {/* Search and Filters */}
      <div className="mb-8 lg:mb-20 flex flex-col items-center">
        <div className="relative w-full max-w-4xl group mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full pl-12 lg:pl-20 pr-8 py-3 lg:py-6 rounded-full border-0 bg-white dark:bg-gray-800 shadow-xl text-base lg:text-2xl text-gray-700 dark:text-white focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900 focus:outline-none transition-all"
          />
          <div className="absolute left-5 lg:left-8 top-1/2 -translate-y-1/2 text-orange-500 text-xl lg:text-3xl">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
        </div>

        {/* Category Filters */}
        <div className="relative w-full max-w-5xl flex items-center px-8 lg:px-12">
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-gray-700 dark:text-gray-200 transition-all duration-300 active:scale-90"
              aria-label="Scroll left"
            >
              <i className="fa-solid fa-chevron-left text-xs sm:text-sm lg:text-base"></i>
            </button>
          )}

          {/* Categories Row */}
          <div
            ref={scrollContainerRef}
            className="w-full overflow-x-auto py-2 no-scrollbar scroll-smooth"
          >
            <div className="flex flex-nowrap gap-2 sm:gap-3 justify-start md:justify-[safe_center] px-4">
              {loading ? (
                <CategorySkeleton count={6} />
              ) : (
                displayCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-full font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all flex-shrink-0 ${
                      activeCategory === cat.name
                        ? "bg-orange-500 text-white shadow-3d-orange scale-105"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-3d-gray hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-500"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-gray-700 dark:text-gray-200 transition-all duration-300 active:scale-90"
              aria-label="Scroll right"
            >
              <i className="fa-solid fa-chevron-right text-xs sm:text-sm lg:text-base"></i>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-12">
          <section className="mb-12 lg:mb-24">
            <div className="w-48 h-10 mb-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-10">
              <CardSkeleton count={6} heightClass="h-64 lg:h-[450px]" />
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Group products by categories */}
          {categories
            .sort((a, b) => (a.name === "Most Sales" ? -1 : b.name === "Most Sales" ? 1 : 0))
            .map((category) => {
              if (activeCategory !== "All" && activeCategory !== category.name) return null;

              let categoryProducts =
                category.name === "Most Sales"
                  ? filteredProducts.filter((p) => p.is_best_seller)
                  : filteredProducts.filter((p) => p.category === category.name);

              if (categoryProducts.length === 0) return null;

              const cleanId = category.name.trim().toLowerCase().replace(/\s+/g, "-");

              return (
                <section
                  key={category.id}
                  id={cleanId}
                  className="mb-12 lg:mb-24 menu-section scroll-margin-top-[140px]"
                >
                  <h2 className="text-xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 lg:mb-10 border-b border-gray-200 dark:border-gray-700 pb-4 flex items-center gap-2">
                    {category.name === "Most Sales" ? "🔥 Best Sellers" : `${category.name} Collection`}
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-10">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group relative h-64 lg:h-[450px] w-full rounded-2xl lg:rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-2xl product-card border border-gray-100 dark:border-gray-800 transition-all duration-300"
                      >
                        {/* Image background */}
                        <div className="absolute inset-0 w-full h-full">
                          <img
                            src={product.image_url || "https://via.placeholder.com/300"}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                            alt={product.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        </div>

                        {/* Title and price info */}
                        <div className="absolute bottom-0 left-0 w-full p-3 lg:p-8 z-20 flex items-end justify-between">
                          <div className="flex flex-col gap-0.5 lg:gap-1 w-[75%]">
                            <h3 className="text-white text-sm lg:text-3xl font-bold product-name leading-tight drop-shadow-md line-clamp-2">
                              {product.name}
                            </h3>
                            <span className="text-orange-300 text-sm lg:text-2xl font-bold">
                              {product.price} $
                            </span>
                          </div>

                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="w-8 h-8 lg:w-16 lg:h-16 bg-white dark:bg-gray-800 dark:text-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-500 hover:text-white transition-all transform active:scale-95"
                          >
                            <i className="fa-solid fa-basket-shopping text-xs lg:text-xl"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
};
