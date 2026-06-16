import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCart } from "../context/CartContext";
import Swal from "sweetalert2";
import { CardSkeleton } from "../components/ui/Skeleton";
import AnimatedCardStack from "../components/ui/animate-card-animation";

gsap.registerPlugin(ScrollTrigger);

interface Product {
  id: number;
  name: string;
  category: string;
  price: string | number;
  image_url: string;
  is_best_seller: boolean;
}

const myCategories = [
  { 
      name: 'Roll', 
      icon: '<i class="fa-solid fa-scroll"></i>', 
      desc: 'Fresh Atlantic salmon, tuna, and yellowtail rolls prepared daily.', 
      img: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=600&auto=format&fit=crop' 
  },
  { 
      name: 'Set', 
      icon: '<i class="fa-solid fa-box"></i>', 
      desc: 'Curated combinations perfect for lunch boxes or sharing.', 
      img: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=600&auto=format&fit=crop' 
  },
  { 
      name: 'Hot Roll', 
      icon: '<i class="fa-solid fa-fire"></i>', 
      desc: 'Baked to perfection with spicy mayo and eel sauce.', 
      img: 'https://images.unsplash.com/photo-1633478062482-790e3b5dd810?q=80&w=600&auto=format&fit=crop' 
  },
  { 
      name: 'Maki', 
      icon: '<i class="fa-solid fa-circle-dot"></i>', 
      desc: 'Classic hosomaki rolls wrapped in crisp nori.', 
      img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600&auto=format&fit=crop' 
  },
  { 
      name: 'Ramen', 
      icon: '<i class="fa-solid fa-bowl-food"></i>', 
      desc: 'Rich, creamy tonkotsu broth with handmade noodles.', 
      img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600&auto=format&fit=crop' 
  },
  { 
      name: 'Poke', 
      icon: '<i class="fa-solid fa-fish"></i>', 
      desc: 'Healthy Hawaiian-style bowls with marinated fish.', 
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop' 
  }
];

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "";
    axios.get(`${apiBaseUrl}/api/products`)
      .then(res => {
        const rawProducts = res.data.products || res.data || [];
        setProducts(Array.isArray(rawProducts) ? rawProducts : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 1. GSAP Scroll Animation (Kept for other potential elements, but cleaned up feature-card logic)
  useEffect(() => {
    let ctx = gsap.context(() => {
      // Logic for feature cards removed as it's replaced by AnimatedCardStack
    });

    return () => ctx.revert();
  }, []);

  // 2. Scroll Reveal Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".scroll-hidden");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [products]);

  const handleAddToCart = async (productId: number) => {
    const res = await addToCart(productId);
    if (res.success) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Item added to cart",
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: res.error === "unauthorized" ? "Please login to add items to the cart." : res.error
      });
    }
  };

  const bestSellers = products.filter(p => p.is_best_seller === true).slice(0, 8);

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-300">
      <style>{`
        /* Scroll reveal styling exactly matching index.ejs */
        .scroll-hidden {
          opacity: 0;
          transform: translateY(60px);
          transition: opacity 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: opacity, transform;
        }

        .reveal-active {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .scroll-hidden {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <AnimatedCardStack />

      {/* Categories Section */}

      {/* ─── 2. CATEGORIES SECTION (EJS our_category.ejs) ─── */}
      <section id="our-menu" className="py-12 lg:py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 lg:mb-10 text-center">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white scroll-hidden">
              Our Categories
            </h2>
            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-2 scroll-hidden style-delay-100">
              Explore our wide variety of Japanese delicacies
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-8">
            {myCategories.map((cat, index) => {
              const menuId = cat.name.trim().toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={cat.name}
                  to={`/menu#${menuId}`}
                  className="group relative h-40 lg:h-80 rounded-2xl lg:rounded-[2rem] overflow-hidden bg-gray-800 no-underline shadow-md lg:shadow-xl hover:shadow-2xl border border-gray-150 dark:border-gray-800 transition-all duration-300 scroll-hidden"
                  style={{ transitionDelay: `${(index + 1) * 0.1}s` }}
                >
                  <div className="absolute inset-0 w-full h-full">
                    <img
                      src={cat.img}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={cat.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300"></div>
                  </div>

                  <div className="relative h-full p-4 lg:p-6 flex flex-col items-center justify-center text-center z-10">
                    <div className="bg-white/95 dark:bg-gray-900/95 px-5 py-2.5 rounded-2xl border-b-4 border-orange-500 shadow-xl shadow-black/30 transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 mb-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-sm lg:text-xl tracking-wide">
                        {cat.name}
                      </h3>
                    </div>

                    <div className="hidden lg:block max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden w-full px-4">
                      <p className="text-gray-200 text-sm mb-4 leading-relaxed">{cat.desc}</p>
                      <span className="inline-block px-6 py-2 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md hover:bg-orange-600 transition-colors">
                        View Items
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 3. BEST SELLERS SECTION (EJS mostsale.ejs) ─── */}
      <section className="py-8 lg:py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-6 lg:mb-8 scroll-hidden">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">🔥 Most Sales</h2>
            <Link to="/menu" className="text-orange-500 font-semibold hover:underline text-sm lg:text-base">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-8">
            {loading ? (
              <CardSkeleton count={8} heightClass="h-64 lg:h-[450px]" />
            ) : bestSellers.length > 0 ? (
              bestSellers.map((product, index) => (
                <div
                  key={product.id}
                  className="group relative h-64 lg:h-[450px] w-full rounded-2xl lg:rounded-[2rem] overflow-hidden shadow-md lg:shadow-xl transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-800 scroll-hidden"
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 w-full h-full">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl lg:text-6xl">
                        🍣
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300"></div>
                  </div>

                  <div className="absolute top-3 left-3 lg:top-5 lg:left-5 bg-yellow-400 text-black text-[10px] lg:text-xs font-bold px-2 py-1 lg:px-3 lg:py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1">
                    <i className="fa-solid fa-fire"></i> TOP HIT
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-3 lg:p-6 z-20 flex flex-col gap-0.5 lg:gap-2 translate-y-1 lg:translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-orange-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider mb-0 lg:mb-1">
                      {product.category} Favorite
                    </span>

                    <h3 className="text-white text-sm lg:text-2xl font-bold leading-tight shadow-black drop-shadow-md line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="hidden lg:block text-gray-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      Delicious fresh ingredients prepared daily for maximum flavor.
                    </p>

                    <div className="flex items-center justify-between mt-1 lg:mt-2 pt-2 lg:pt-4 border-t border-white/20">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-[10px] lg:text-xs uppercase">Price</span>
                        <span className="text-white text-lg lg:text-2xl font-extrabold">
                          {Number(product.price).toFixed(2)} $
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
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 col-span-2 lg:col-span-4 text-center py-10 scroll-hidden">
                No best sellers available yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
