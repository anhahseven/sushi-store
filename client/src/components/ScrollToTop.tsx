import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Scroll the main window to the top
      window.scrollTo(0, 0);

      // Reset scroll position for any div containers with overflow scroll/auto
      const scrollContainers = document.querySelectorAll(".overflow-y-auto, .overflow-y-scroll");
      scrollContainers.forEach((container) => {
        container.scrollTop = 0;
      });
    };

    // Run immediately, on next frame, and after 50ms fallback to handle render delay and browser overrides
    handleScroll();
    const frameId = requestAnimationFrame(handleScroll);
    const timeoutId = setTimeout(handleScroll, 50);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
