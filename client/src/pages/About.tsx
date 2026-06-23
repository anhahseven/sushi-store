import React from "react";
import { Link } from "react-router-dom";

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-10 lg:mt-36 mb-20 font-sans">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
        <div>
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
            <i className="fa-solid fa-trophy"></i>
            <span>Voted #1 Sushi Store in Cambodia</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            Experience the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              Soul of Japan
            </span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-lg">
            Welcome to Murakami City. We bring the authentic taste of Japan to the heart of
            Cambodia. Led by chefs from 5-star hotels, we promise speed, hygiene, and unmatched
            quality in every bite.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/menu"
              className="bg-gray-900 dark:bg-orange-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-orange-500 dark:hover:bg-orange-500 hover:shadow-orange-200 hover:-translate-y-1 transition-all duration-300"
            >
              View Our Menu
            </Link>
            <Link
              to="/location"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-full font-bold shadow-sm hover:border-orange-500 hover:text-orange-500 transition-all duration-300"
            >
              Find Our Location
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700">
            <img
              src="https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1925"
              alt="Master Chef"
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Head Chef</p>
              <h3 className="text-2xl font-bold">Kenji Nakamura</h3>
              <p className="text-xs mt-1 bg-white/20 backdrop-blur-md inline-block px-2 py-1 rounded">
                Ex-5 Star Hotel Executive Chef
              </p>
            </div>
          </div>

          <div className="hidden md:block absolute -top-10 -right-5 z-20 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full text-yellow-600 dark:text-yellow-400">
                <i className="fa-solid fa-star text-xl"></i>
              </div>
              <div>
                <div className="font-extrabold text-gray-900 dark:text-white text-lg">4.9/5</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Customer Favorite
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block absolute top-10 -left-10 w-full h-full border-2 border-orange-200 dark:border-orange-900/30 rounded-[3rem] -z-10"></div>
        </div>
      </section>

      <section className="mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Why We Are The Best
          </h2>
          <p className="text-gray-400 mt-2">Uncompromising quality standard since 2015</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-750 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-plane-arrival"></i>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">Direct from Japan</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              We don't use local substitutes. Our fish and rice are flown in daily from Tokyo
              markets to ensure authentic flavor.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-750 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">5-Star Hotel Chefs</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Our culinary team is led by masters with over 20 years of experience in top-tier 5-star
              luxury hotels.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-750 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-500 dark:text-green-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-stopwatch"></i>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">Fast & Clean</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              We pride ourselves on immaculate hygiene and lightning-fast cooking without
              sacrificing quality.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-750 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 dark:text-orange-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-heart"></i>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">Highly Recommended</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              With thousands of 5-star reviews, we are the go-to spot for locals and tourists seeking
              the best.
            </p>
          </div>
        </div>
      </section>

      <section className="relative rounded-[3rem] overflow-hidden bg-gray-900 text-white py-20 px-8 text-center">
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=2000"
            className="w-full h-full object-cover"
            alt="Sushi Prep"
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-4 block">
            Premium Location
          </span>
          <h2 className="text-4xl font-extrabold mb-6">Located in the Best Area</h2>
          <p className="text-gray-300 text-lg mb-8">
            Enjoy your meal in a clean, modern, and accessible environment. We are situated in the
            heart of the city with ample parking.
          </p>
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div>
              <div className="text-3xl font-bold text-orange-400">100%</div>
              <div className="text-xs text-gray-400 uppercase mt-1">Quality</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">20min</div>
              <div className="text-xs text-gray-400 uppercase mt-1">Avg Cook Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">Top 1</div>
              <div className="text-xs text-gray-400 uppercase mt-1">In Cambodia</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
