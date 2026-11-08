import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useInView, useSpring, useMotionValue } from "motion/react";

// Three.js is over half of the page's JS and its setup blocks the main thread,
// so it loads separately, once the footer is getting close.
const FooterShape = dynamic(
  () => import("./FooterShape").then((mod) => mod.FooterShape),
  { ssr: false },
);

// Slightly longer than the page's staggered entrance animation.
const ENTRANCE_MS = 2000;

export function Footer() {
  const footerRef = useRef(null);
  const [isNear, setIsNear] = useState(false);
  const isOnScreen = useInView(footerRef);
  const lastTouchY = useRef(null);

  // Only start checking once the entrance has played, so the shape can't load
  // on top of it. The sliders are measured by then too; before that the page
  // is shorter and the footer wrongly reads as close.
  useEffect(() => {
    let observer;
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setIsNear(true);
          observer.disconnect();
        },
        // On phones the footer starts ~1200px below the fold, so stay under that.
        { rootMargin: "800px 0px" },
      );
      observer.observe(footerRef.current);
    }, ENTRANCE_MS);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  const inputIntensity = useMotionValue(0);

  const smoothSpeed = useSpring(inputIntensity, {
    stiffness: 25,
    damping: 20,
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollTimeout;
    let pendingSpeed = null;
    let rafId = 0;

    const flush = () => {
      rafId = 0;
      if (pendingSpeed !== null) {
        inputIntensity.set(pendingSpeed);
        pendingSpeed = null;
      }
    };

    const queueSpeed = (speed) => {
      pendingSpeed = speed;
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    const onWheel = (e) => {
      queueSpeed(Math.min(Math.abs(e.deltaY) / 120, 1));
    };

    const onTouchStart = (e) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (lastTouchY.current !== null) {
        const dy = Math.abs(e.touches[0].clientY - lastTouchY.current);
        queueSpeed(Math.min(dy / 25, 1));
      }
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      lastTouchY.current = null;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => inputIntensity.set(0), 150);
    };

    const onScroll = () => {
      const now = performance.now();
      const dt = now - lastScrollTime;
      lastScrollTime = now;
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;

      const velocity = dt > 0 ? (dy / dt) * 16 : 0;
      queueSpeed(Math.min(velocity / 30, 1));

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => inputIntensity.set(0), 150);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimeout);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [inputIntensity]);

  return (
    <footer className="footer" ref={footerRef}>
      {isNear && (
        <FooterShape
          speedMultiplier={smoothSpeed}
          inputIntensity={inputIntensity}
          isOnScreen={isOnScreen}
        />
      )}
    </footer>
  );
}
