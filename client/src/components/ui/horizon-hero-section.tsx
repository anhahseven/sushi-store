import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HorizonHeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force video to load and keep it paused
    video.load();
    video.pause();

    // Prevent any automatic playback by listening to play events and pausing immediately
    const preventPlay = () => {
      video.pause();
    };
    video.addEventListener('play', preventPlay);

    // Initialize currentTime to 1 when metadata is loaded or if already loaded
    const initVideoTime = () => {
      video.currentTime = 1;
      video.pause();
    };
    video.addEventListener('loadedmetadata', initVideoTime);
    if (video.readyState >= 1) {
      initVideoTime();
    }

    const currentSectionRef = { current: 0 };
    const isAnimatingRef = { current: false };

    // Track video tween reference
    let videoTween: gsap.core.Tween | null = null;

    // Create the timeline mapped to the scroll progress immediately on mount
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=300%", // 300vh total scroll distance (3 sections)
        scrub: 1,      // Smooth scrubbing
        pin: true,     // Pin the hero section while scrolling
        onUpdate: (self) => {
          if (!isAnimatingRef.current) {
            currentSectionRef.current = Math.round(self.progress * 3);
            // Sync video currentTime linearly if user drags the scrollbar manually
            video.currentTime = 1 + self.progress * 9;
          }
        }
      }
    });

    const scrollTriggerInstance = tl.scrollTrigger;

    // --- SECTION TRANSITIONS ---
    // --- SECTION 1 ---
    tl.to(section1Ref.current, { opacity: 0, y: -50, duration: 0.4 }, 0.2)

    // --- SECTION 2 ---
    .fromTo(section2Ref.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4 }, 0.6)
    .to(section2Ref.current, { opacity: 0, y: -50, duration: 0.4 }, 1.2)

    // --- SECTION 3 ---
    .fromTo(section3Ref.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4 }, 1.6)

    // Force the timeline duration to be 3.0
    .addLabel("end", 3.0);

    const goToSection = (index: number) => {
      if (!scrollTriggerInstance) return;
      isAnimatingRef.current = true;
      currentSectionRef.current = index;

      const start = scrollTriggerInstance.start;
      const targetScroll = start + index * window.innerHeight;

      // Animate page scroll position to the target section (takes 1.0s)
      const scrollObj = { y: window.scrollY };
      gsap.to(scrollObj, {
        y: targetScroll,
        duration: 1.0,
        ease: "power2.out",
        onUpdate: () => {
          window.scrollTo(0, scrollObj.y);
        },
        onComplete: () => {
          isAnimatingRef.current = false;
        }
      });

      // Kill any active video tween
      if (videoTween) videoTween.kill();

      // Animate the video currentTime at normal playback speed (duration matches video delta)
      const targetTime = 1 + index * 3;
      const duration = Math.abs(targetTime - video.currentTime);
      videoTween = gsap.to(video, {
        currentTime: targetTime,
        duration: duration,
        ease: "none"
      });
    };

    const handleWheel = (e: WheelEvent) => {
      if (!scrollTriggerInstance) return;
      const start = scrollTriggerInstance.start;
      const end = scrollTriggerInstance.end;
      const currentScroll = window.scrollY;

      if (currentScroll >= start && currentScroll <= end + 10) {
        // If scrolling up near the end
        if (e.deltaY < 0 && currentScroll >= end - 10) {
          e.preventDefault();
          if (!isAnimatingRef.current) {
            goToSection(2);
          }
          return;
        }

        // Inside the hero
        if (currentScroll < end - 10) {
          e.preventDefault();
          if (isAnimatingRef.current) return;
          const direction = e.deltaY > 0 ? 1 : -1;
          const targetIndex = currentSectionRef.current + direction;
          if (targetIndex >= 0 && targetIndex <= 3) {
            goToSection(targetIndex);
          }
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!scrollTriggerInstance) return;
      const start = scrollTriggerInstance.start;
      const end = scrollTriggerInstance.end;
      const currentScroll = window.scrollY;

      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      if (currentScroll >= start && currentScroll <= end + 10) {
        // If dragging down (scrolling up) near the end
        if (deltaY < 0 && currentScroll >= end - 10) {
          e.preventDefault();
          if (!isAnimatingRef.current) {
            goToSection(2);
          }
          return;
        }

        // Inside the hero
        if (currentScroll < end - 10) {
          e.preventDefault();
          if (isAnimatingRef.current) return;

          if (Math.abs(deltaY) > 30) {
            const direction = deltaY > 0 ? 1 : -1;
            const targetIndex = currentSectionRef.current + direction;
            if (targetIndex >= 0 && targetIndex <= 3) {
              goToSection(targetIndex);
            }
            touchStartY = touchEndY;
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollTriggerInstance) return;
      const start = scrollTriggerInstance.start;
      const end = scrollTriggerInstance.end;
      const currentScroll = window.scrollY;

      if (currentScroll >= start && currentScroll < end) {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(e.key)) {
          e.preventDefault();
          if (isAnimatingRef.current) return;

          let direction = 0;
          if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
            direction = 1;
          } else if (e.key === "ArrowUp" || e.key === "PageUp") {
            direction = -1;
          }

          const targetIndex = currentSectionRef.current + direction;
          if (targetIndex >= 0 && targetIndex <= 3) {
            goToSection(targetIndex);
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      if (videoTween) videoTween.kill();
      video.removeEventListener('loadedmetadata', initVideoTime);
      video.removeEventListener('play', preventPlay);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Video */}
      <video
        ref={videoRef}
        src="/videos/please_remove_first_sushi_stay.mp4#t=1"
        muted
        playsInline
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60 pointer-events-none"
      />
      
      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/80 z-0" />

      {/* 3 Layered Text Sections */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-4">
        
        {/* Section 1: Discover The Horizon (Video 1s) */}
        <div ref={section1Ref} className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight drop-shadow-2xl uppercase">
            Discover The <span className="text-orange-400">Horizon</span>
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-gray-200 max-w-2xl font-light drop-shadow-md">
            Immerse yourself in a transformative sushi experience. Where tradition meets the unexpected.
          </p>
          <button className="mt-10 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full transition-all duration-300 font-medium tracking-wide uppercase text-sm">
            Explore Menu
          </button>
        </div>

        {/* Section 2: Masterful Craft (Video 4s) */}
        <div ref={section2Ref} className="absolute inset-0 flex flex-col items-center justify-center px-4" style={{ opacity: 0 }}>
          <p className="text-xl tracking-[0.4em] text-orange-300 mb-4 uppercase font-semibold">The Art</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight drop-shadow-2xl uppercase">
            Masterful <span className="text-orange-400">Craft</span>
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-gray-200 max-w-2xl font-light drop-shadow-md">
            Witness the precision, dedication, and culinary artistry behind every single slice.
          </p>
        </div>

        {/* Section 3: Indulge in Tradition (Video 7s to 10s) */}
        <div ref={section3Ref} className="absolute inset-0 flex flex-col items-center justify-center px-4" style={{ opacity: 0 }}>
          <p className="text-xl tracking-[0.4em] text-orange-300 mb-4 uppercase font-semibold">The Experience</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight drop-shadow-2xl uppercase">
            Indulge in <span className="text-orange-400">Tradition</span>
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-gray-200 max-w-2xl font-light drop-shadow-md">
            A gastronomic journey that redefines what Japanese fine dining can be.
          </p>
        </div>

      </div>

      {/* Persistent Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-60 animate-bounce">
        <span className="text-xs tracking-[0.3em] uppercase mb-2">Scroll Down</span>
        <ChevronDown size={24} />
      </div>
    </div>
  );
}


