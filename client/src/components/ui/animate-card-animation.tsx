"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ChevronRight, Sparkles, Clock, Utensils, Award } from "lucide-react"
import { Link } from "react-router-dom"

interface Card {
  id: number
  title: string
  description: string
  image: string
  tag: string
  category: string
  price: string
}

const cardData: Card[] = [
  {
    id: 1,
    title: "Premium Nigiri Selection",
    description: "Chef's selection of fresh sliced bluefin tuna, king salmon, and line-caught wild yellowtail hand-pressed over warm seasoned sushi rice and brushed with house glaze.",
    image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800&q=80",
    tag: "Chef's Signature",
    category: "Nigiri",
    price: "24.00"
  },
  {
    id: 2,
    title: "Signature Dragon Rolls",
    description: "Crispy wild-caught shrimp tempura and fresh English cucumber topped with thin-sliced avocado, sweet caramelized unagi (eel), and toasted white sesame seeds.",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80",
    tag: "Most Popular",
    category: "Rolls",
    price: "18.50"
  },
  {
    id: 3,
    title: "Rich Tonkotsu Shio Ramen",
    description: "Rich chashu pork broth slow-simmered for 16 hours, seasoned with natural mineral sea salt, served with fresh springy noodles, soft ajitama egg, bamboo, and nori.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
    tag: "Traditional Comfort",
    category: "Ramen",
    price: "16.00"
  },
  {
    id: 4,
    title: "Spicy Bluefin Tuna Maki",
    description: "Hand-chopped bluefin tuna dressed in house fermented chili oil and kewpie mayo, rolled with scallions and crisp cucumber in premium toasted nori.",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
    tag: "Spicy Favorite",
    category: "Maki",
    price: "14.50"
  },
]

function CardContent({ card }: { card: Card }) {
  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden group">
      {/* Image Container */}
      <div className="relative w-full h-[180px] xs:h-[200px] sm:h-[260px] md:h-[280px] overflow-hidden">
        <img
          src={card.image}
          alt={card.title}
          className="h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          {card.category}
        </div>
        
        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-gray-950/80 backdrop-blur-md text-white text-[11px] sm:text-sm font-extrabold px-3 py-1 rounded-lg">
          {card.price} $
        </div>
      </div>
      
      {/* Info Section */}
      <div className="flex flex-col justify-between flex-1 p-4 sm:p-6 bg-white dark:bg-gray-950">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="font-extrabold text-sm sm:text-lg md:text-xl text-gray-900 dark:text-white leading-tight">
            {card.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs md:text-sm line-clamp-2 sm:line-clamp-3 font-normal leading-relaxed">
            {card.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-900 pt-3 sm:pt-4 mt-2">
          <span className="text-[10px] sm:text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
            <Award size={12} />
            House Recipe
          </span>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 font-semibold group-hover:text-orange-500 transition-colors">
            <span>Details</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnimatedCardStack() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [heroStyles, setHeroStyles] = useState({
    scale: 1,
    borderRadius: "0px",
  })

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const element = containerRef.current
    if (!element) return

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "+=2400",
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress
        const totalCards = cardData.length
        
        // 1. Navbar Visibility: hide when inside card stages (progress < 0.82), show when zooming out at the end
        if (progress < 0.82) {
          document.body.classList.add("hero-nav-hidden")
        } else {
          document.body.classList.remove("hero-nav-hidden")
        }

        // 2. Cycle cards within first 80% scroll progress (0.0 -> 0.8)
        const cardProgress = Math.min(progress / 0.8, 1)
        const rawIndex = Math.floor(cardProgress * totalCards)
        const index = Math.max(0, Math.min(rawIndex, totalCards - 1))
        setActiveIndex(index)

        // 3. Zoom out effect in the final 20% scroll progress (0.8 -> 1.0)
        if (progress > 0.8) {
          const zoomProgress = (progress - 0.8) / 0.2
          const targetScale = 1 - zoomProgress * 0.08 // scale down to 0.92
          const targetRadius = `${zoomProgress * 24}px` // rounded corners up to 24px
          setHeroStyles({
            scale: targetScale,
            borderRadius: targetRadius,
          })
        } else {
          setHeroStyles({
            scale: 1,
            borderRadius: "0px",
          })
        }
      }
    })

    return () => {
      trigger.kill()
      document.body.classList.remove("hero-nav-hidden")
    }
  }, [])

  const getCardStyles = (cardIndex: number, currentActive: number) => {
    if (cardIndex < currentActive) {
      // Exited (slid down and faded out)
      return {
        y: 450,
        scale: 0.95,
        rotate: 10,
        opacity: 0,
        zIndex: 10 + cardIndex,
        pointerEvents: "none" as const,
      }
    }

    const relativeIndex = cardIndex - currentActive
    const rotations = [0, -3, 3, -1]
    const rot = rotations[relativeIndex] ?? 0

    return {
      y: -relativeIndex * 24,
      scale: 1 - relativeIndex * 0.04,
      rotate: rot,
      opacity: relativeIndex > 2 ? 0 : 1 - relativeIndex * 0.25,
      zIndex: 10 - relativeIndex,
      pointerEvents: relativeIndex === 0 ? ("auto" as const) : ("none" as const),
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="-mt-16 lg:-mt-20 w-full h-screen overflow-hidden bg-white dark:bg-[#0a0a0a] flex items-center justify-center"
    >
      {/* Inner Scalable Card Wrapper */}
      <div
        className={`w-full h-full bg-gradient-to-br from-slate-50 to-orange-50/20 dark:from-gray-950 dark:to-gray-900 flex items-center relative overflow-hidden transition-all duration-300 border ${
          heroStyles.scale < 1 ? "border-gray-200/80 dark:border-gray-800/80" : "border-transparent"
        }`}
        style={{
          transform: `scale(${heroStyles.scale})`,
          borderRadius: heroStyles.borderRadius,
          boxShadow: heroStyles.scale < 1 
            ? "0 40px 100px -15px rgba(0, 0, 0, 0.12), 0 20px 40px -20px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.02)" 
            : "none",
        }}
      >
        {/* Background Japanese Elements */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-10 dark:opacity-[0.03]">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full border-[80px] border-orange-500" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full border-[80px] border-orange-500" />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 z-10">
          {/* Left column: Text content */}
          <div className="flex flex-col justify-center gap-4 sm:gap-6 w-full lg:w-[48%] h-[35%] lg:h-auto text-left order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col gap-2 sm:gap-4"
              >
                <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-orange-100 dark:bg-orange-950/50 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                  <Sparkles size={12} className="animate-pulse" />
                  {cardData[activeIndex].tag}
                </div>
                
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                  {cardData[activeIndex].title}
                </h2>
                
                <p className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                  {cardData[activeIndex].description}
                </p>

                <div className="flex items-center gap-4 sm:gap-6 mt-1 sm:mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Utensils size={14} className="text-orange-500" />
                    <span>Category: <strong className="font-semibold text-gray-700 dark:text-gray-200">{cardData[activeIndex].category}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={14} className="text-orange-500" />
                    <span>Prep: <strong className="font-semibold text-gray-700 dark:text-gray-200">10-15m</strong></span>
                  </div>
                </div>
                
                <div className="mt-2 sm:mt-4">
                  <Link
                    to={`/menu#${cardData[activeIndex].category.toLowerCase()}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    <span>Order Now</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar & navigation */}
            <div className="flex flex-col gap-2 w-full mt-4 border-t border-gray-100 dark:border-gray-900 pt-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                <span>Signature Experience</span>
                <span>{String(activeIndex + 1).padStart(2, '0')} / 04</span>
              </div>
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
                  animate={{ width: `${((activeIndex + 1) / cardData.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                />
              </div>
              {/* Custom Dot Navigation triggers Scroll positions */}
              <div className="flex gap-2 mt-2">
                {cardData.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const scrollTrigger = ScrollTrigger.getAll().find(st => st.vars.trigger === containerRef.current);
                      if (scrollTrigger) {
                        const scrollPos = scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * (idx / 3);
                        window.scrollTo({ top: scrollPos, behavior: "smooth" });
                      }
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeIndex === idx ? "w-8 bg-orange-500" : "w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to section ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Card stack */}
          <div className="relative flex items-center justify-center w-full lg:w-[48%] h-[50%] lg:h-[550px] order-1 lg:order-2">
            <div className="relative w-[290px] h-[340px] xs:w-[320px] xs:h-[370px] sm:w-[380px] sm:h-[420px] md:w-[440px] md:h-[450px]">
              {cardData.map((card, index) => {
                const animatedStyles = getCardStyles(index, activeIndex)
                return (
                  <motion.div
                    key={card.id}
                    animate={animatedStyles}
                    transition={{
                      type: "spring",
                      duration: 0.8,
                      bounce: 0.1,
                    }}
                    className="absolute inset-0 origin-bottom"
                  >
                    <CardContent card={card} />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Subtle Scroll Down Helper */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 z-20 opacity-55 dark:opacity-35 pointer-events-none">
          <span className="text-[9px] tracking-widest uppercase font-bold text-gray-500 dark:text-gray-400">Scroll Down to Explore</span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1 h-2.5 bg-gray-500 dark:bg-gray-400 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
