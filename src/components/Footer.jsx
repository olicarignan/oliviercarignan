import { useRef, useEffect } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  useScroll,
  useMotionTemplate,
} from "motion/react";
import { FooterShape } from "./FooterShape";

export function Footer() {
  const footerRef = useRef(null);
  const lastTouchY = useRef(null);

  const inputIntensity = useMotionValue(0);

  const smoothSpeed = useSpring(inputIntensity, {
    stiffness: 25,
    damping: 20,
  });

  const smoothOpacity = useSpring(
    useTransform(inputIntensity, [0, 1], [0, 0.4]),
    { stiffness: 20, damping: 22 }
  );

  const { scrollYProgress } = useScroll();
  const heightValue = useTransform(scrollYProgress, [0.5, 1], [25, 100]);
  const smoothHeight = useSpring(heightValue, { stiffness: 60, damping: 20 });
  const height = useMotionTemplate`${smoothHeight}dvh`;

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
    <motion.footer className="footer" ref={footerRef} style={{ height }}>
      <FooterShape speedMultiplier={smoothSpeed} />
    </motion.footer>
  );
}
