import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue } from "framer-motion";
import axios from "axios";
import HorizonHeroSection from "../components/ui/horizon-hero-section";

const spring = { stiffness: 80, damping: 20, mass: 1.2 };
const easeOut = [0.16, 1, 0.3, 1];

/* ─── 3D Flip Card ─── */
function FlipCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotateY = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [-90, -10, 10, 0]);
  const translateZ = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [-120, -20, 30, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.7, 0.9, 1.02, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5, 1], [0, 0.5, 1, 1]);

  const colorMap: Record<string, { bg: string; text: string }> = {
    orange: { bg: "bg-orange-500/15", text: "text-orange-400" },
    blue: { bg: "bg-blue-500/15", text: "text-blue-400" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
    purple: { bg: "bg-purple-500/15", text: "text-purple-400" },
    red: { bg: "bg-red-500/15", text: "text-red-400" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-400" },
    cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  };
  const c = colorMap[color] || colorMap.orange;

  return (
    <motion.div ref={ref} className="relative" style={{ perspective: 1200, opacity }}>
      <motion.div
        className="relative p-7 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 overflow-hidden card-3d"
        style={{
          rotateY: useSpring(rotateY, spring),
          translateZ: useSpring(translateZ, spring),
          scale: useSpring(scale, spring),
          transformStyle: "preserve-3d",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div className="absolute inset-0 animate-shimmer-3d pointer-events-none rounded-3xl" />
        <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-5`}>
          <i className={`fa-solid ${icon} text-xl ${c.text}`} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product, idx }: { product: any; idx: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [idx % 2 === 0 ? -8 : 8, 0, idx % 2 === 0 ? 8 : -8]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.85, 0.95, 1.02, 1]);

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-3xl overflow-hidden bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 card-3d"
      style={{
        y: useSpring(y, spring),
        rotateY: useSpring(rotateY, { stiffness: 60, damping: 25 }),
        scale: useSpring(scale, spring),
        transformStyle: "preserve-3d",
      }}
    >
      <div className="relative h-52 overflow-hidden bg-black/30">
        {product.image_url ? (
          <motion.img src={product.image_url} alt={product.name} className="w-full h-full object-cover"
            style={{ scale: useTransform(scrollYProgress, [0, 1], [1.1, 0.95]) }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍣</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white mb-1">{product.name}</h3>
        <p className="text-white/40 text-xs mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-orange-400">${Number(product.price).toFixed(2)}</span>
          <Link to="/menu" className="px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors">Order</Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [toast, setToast] = useState("");
  const ctaRef = useRef(null);

  const { scrollYProgress: ctaScroll } = useScroll({ target: ctaRef, offset: ["start end", "center center"] });
  const ctaRotateX = useTransform(ctaScroll, [0, 0.5, 1], [-60, -5, 0]);
  const ctaZ = useTransform(ctaScroll, [0, 0.5, 1], [-200, -20, 0]);
  const ctaOpacity = useTransform(ctaScroll, [0, 0.4, 1], [0, 0.5, 1]);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    axios.get(`${apiBaseUrl}/api/products?limit=6`)
      .then(res => setFeatured(res.data)).catch(console.error);
  }, []);

  const sectionHeading = (badge: string, badgeIcon: string, title: string, highlight: string, desc: string) => (
    <motion.div
      className="text-center mb-20"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: easeOut }}
    >
      <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-orange-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
        <i className={`fa-solid ${badgeIcon}`} /> {badge}
      </span>
      <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
        {title} <span className="text-orange-400">{highlight}</span>
      </h2>
      <p className="text-white/40 max-w-xl mx-auto">{desc}</p>
    </motion.div>
  );

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Our New Video Animation Background Hero Section */}
      <HorizonHeroSection />

      {/* ═══ FEATURES ═══ */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          {sectionHeading("Why Choose Us", "fa-star", "Crafted with", "Passion", "Every dish tells a story of tradition, quality, and relentless pursuit of perfection.")}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FlipCard icon="fa-fish" title="Premium Quality" desc="Only the freshest ingredients sourced from trusted suppliers. Our fish and rice are flown in daily from Tokyo markets." color="orange" />
            <FlipCard icon="fa-stopwatch" title="Lightning Fast" desc="Quick and reliable preparation right to your table. We pride ourselves on immaculate hygiene and speed without sacrifice." color="blue" />
            <FlipCard icon="fa-map-location-dot" title="Multiple Locations" desc="Visit us at any of our convenient locations across the city. Each kitchen maintains the same 5-star standard." color="emerald" />
            <FlipCard icon="fa-leaf" title="Farm to Table" desc="We partner directly with local farms and Japanese importers to ensure every ingredient meets our exacting standards." color="emerald" />
            <FlipCard icon="fa-award" title="Award Winning" desc="Recognized as Cambodia's best Japanese restaurant for three consecutive years by the National Culinary Association." color="amber" />
            <FlipCard icon="fa-truck-fast" title="Free Delivery" desc="Free delivery within 10km for orders over $20. Real-time tracking so you know exactly when your food arrives." color="purple" />
            <FlipCard icon="fa-heart" title="Made with Love" desc="Every roll, every bowl, every plate is handcrafted by our chefs who have trained in Tokyo for over a decade." color="red" />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          {sectionHeading("Simple Process", "fa-list-check", "How It", "Works", "From our kitchen to your table in four easy steps.")}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", icon: "fa-utensils", title: "Choose Your Dish", desc: "Browse our curated menu of authentic Japanese cuisine, from classic sushi to modern fusion.", color: "from-orange-500 to-red-500" },
              { step: "02", icon: "fa-cart-shopping", title: "Place Your Order", desc: "Order online or visit us. Customize your meal exactly how you like it.", color: "from-blue-500 to-indigo-500" },
              { step: "03", icon: "fa-fire-burner", title: "We Cook Fresh", desc: "Our master chefs prepare your order with the freshest ingredients, never pre-made.", color: "from-emerald-500 to-teal-500" },
              { step: "04", icon: "fa-face-smile-beam", title: "Enjoy & Relax", desc: "Pick up in-store or get it delivered hot to your door. Every bite is a journey.", color: "from-purple-500 to-pink-500" },
            ].map((item, i) => (
              <motion.div key={item.step} className="relative text-center group" initial={{ opacity: 0, y: 50, rotateX: -15 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.15, ease: easeOut }} style={{ transformStyle: "preserve-3d" }}>
                {i < 3 && <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/10 to-white/5" />}
                <div className={`relative w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`fa-solid ${item.icon} text-white text-2xl`} />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black/50 text-white text-xs font-black flex items-center justify-center shadow-md border border-white/20">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      {featured.length > 0 && (
        <section className="relative py-32 px-4">
          <div className="max-w-7xl mx-auto">
            {sectionHeading("Chef's Selection", "fa-fire", "Featured", "Items", "Hand-picked by our head chef — the most loved dishes on our menu.")}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((product, idx) => (<ProductCard key={product.id} product={product} idx={idx} />))}
            </div>
            <motion.div className="text-center mt-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Link to="/menu" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm">
                View Full Menu <i className="fa-solid fa-arrow-right" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          {sectionHeading("Testimonials", "fa-quote-left", "What Our", "Guests Say", "Don't just take our word for it — hear from the people who've experienced our cuisine.")}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Mitchell", role: "Food Blogger", avatar: "SM", rating: 5, text: "The most authentic Japanese food I've had outside of Tokyo. The omakase experience is absolutely unforgettable — every piece of sushi melts in your mouth.", color: "from-orange-400 to-pink-500" },
              { name: "David Chen", role: "Regular Customer", avatar: "DC", rating: 5, text: "I've been coming here for two years and the quality never drops. The staff remembers my name, the ramen is incredible, and the ambiance is perfect for date nights.", color: "from-blue-400 to-indigo-500" },
              { name: "Yuki Tanaka", role: "Japanese Expat", avatar: "YT", rating: 5, text: "As someone from Japan, I'm picky about sushi. This place genuinely impressed me. The rice seasoning, the fish quality — it's the real deal. My go-to spot in Phnom Penh.", color: "from-emerald-400 to-teal-500" },
            ].map((review, i) => (
              <motion.div key={review.name} className="relative p-8 rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 card-3d overflow-hidden" initial={{ opacity: 0, y: 50, rotateY: i === 1 ? 10 : -10 }} whileInView={{ opacity: 1, y: 0, rotateY: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.15, ease: easeOut }} style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute top-4 right-6 text-6xl font-serif text-white/5 leading-none select-none">"</div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-4">{Array.from({ length: review.rating }).map((_, si) => (<i key={si} className="fa-solid fa-star text-amber-400 text-sm" />))}</div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{review.text}</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-bold text-sm`}>{review.avatar}</div>
                    <div><div className="font-bold text-white text-sm">{review.name}</div><div className="text-white/30 text-xs">{review.role}</div></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section ref={ctaRef} className="relative py-32 overflow-hidden" style={{ perspective: "1200px" }}>
        <motion.div
          className="relative max-w-5xl mx-auto px-6"
          style={{
            rotateX: useSpring(ctaRotateX, { stiffness: 60, damping: 20 }),
            translateZ: useSpring(ctaZ, { stiffness: 60, damping: 20 }),
            opacity: ctaOpacity,
            transformStyle: "preserve-3d",
          }}
        >
          <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 p-12 md:p-20 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/50 via-transparent to-purple-600/50 animate-shimmer-3d" />
            <motion.div className="absolute top-6 left-6 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm" animate={{ rotateZ: [0, 90, 180, 270, 360], scale: [1, 1.1, 1, 0.9, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
            <motion.div className="absolute bottom-6 right-6 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm" animate={{ rotateZ: [360, 270, 180, 90, 0], scale: [1, 0.9, 1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to Taste<br /><span className="text-yellow-200">the Difference?</span></h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">Join thousands of satisfied customers who have made us their go-to destination for authentic Japanese cuisine.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/menu" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-orange-600 font-bold text-lg hover:bg-yellow-100 transition-all shadow-xl hover:scale-105"><i className="fa-solid fa-utensils" /> Order Now</Link>
                <Link to="/location" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all"><i className="fa-solid fa-map-pin" /> Find Us</Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative py-8 text-center text-white/30 text-sm">
        <p>&copy; 2026 Murakami Kitchen. All rights reserved. Made with 🍣 in Cambodia.</p>
      </footer>
    </div>
  );
}
