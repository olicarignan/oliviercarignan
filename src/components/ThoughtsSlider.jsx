"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

const staggerItems = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemFadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0, 0.55, 0.45, 1] },
  },
};

export function ThoughtsSlider({ count = 6 }) {
  const trackRef = useRef(null);
  const scrollTimer = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDistRef = useRef(0);
  const [layout, setLayout] = useState({ inset: 0, itemWidth: 0 });

  useEffect(() => {
    const measure = () => {
      const subgrid = document.querySelector(".subgrid");
      if (!subgrid) return;

      const style = getComputedStyle(subgrid);
      const subgridGap = parseFloat(style.columnGap) || 0;
      const rect = subgrid.getBoundingClientRect();
      const columns =
        parseInt(
          getComputedStyle(document.querySelector(".grid")).getPropertyValue(
            "--columns",
          ),
        ) || 4;
      const colWidth = (rect.width - (columns - 1) * subgridGap) / columns;
      const isDesktop = window.matchMedia("(min-width: 600px)").matches;

      const availableCols = isDesktop ? 5 : columns;
      const availableWidth =
        availableCols * colWidth + (availableCols - 1) * subgridGap;
      const cardWidth = (availableWidth - 8) / 2;

      setLayout({
        inset: isDesktop ? rect.left + colWidth + subgridGap : rect.left,
        itemWidth: cardWidth,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
  }, [layout.inset]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === "touch") return;
    const track = trackRef.current;
    if (!track) return;
    dragDistRef.current = 0;
    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      scrollLeft: track.scrollLeft,
      prevX: e.clientX,
      prevTime: Date.now(),
      velocity: 0,
    };
    setIsDragging(true);
    track.style.scrollSnapType = "none";
    track.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    const now = Date.now();
    const dt = now - ds.prevTime;
    const dx = e.clientX - ds.prevX;
    if (dt > 0) {
      ds.velocity = dx / dt;
    }
    ds.prevX = e.clientX;
    ds.prevTime = now;
    dragDistRef.current = Math.abs(e.clientX - ds.startX);
    trackRef.current.scrollLeft = ds.scrollLeft - (e.clientX - ds.startX);
  }, []);

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.isDragging = false;
    const track = trackRef.current;
    track.releasePointerCapture(e.pointerId);

    if (dragDistRef.current < 5) {
      track.style.scrollSnapType = "x mandatory";
      setIsDragging(false);
      return;
    }

    let velocity = -ds.velocity * 1000;
    const friction = 0.92;
    let lastTime = performance.now();

    const step = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      velocity *= friction;
      track.scrollLeft += velocity * dt;

      if (Math.abs(velocity) > 50) {
        requestAnimationFrame(step);
      } else {
        track.style.scrollSnapType = "x mandatory";
        setIsDragging(false);
      }
    };

    requestAnimationFrame(step);
  }, []);

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <motion.div className="thoughts" variants={staggerItems}>
      <motion.h3
        className="thoughts__title"
        style={{ paddingLeft: `${layout.inset}px` }}
        variants={itemFadeIn}
      >
        Thoughts
      </motion.h3>
      <motion.div
        className="thoughts__track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          paddingLeft: `${layout.inset}px`,
          paddingRight: `${layout.inset}px`,
          scrollPaddingLeft: `${layout.inset}px`,
          touchAction: "pan-x pan-y",
        }}
      >
        {items.map((i) => (
          <motion.div
            key={i}
            className="thoughts__item"
            variants={itemFadeIn}
            style={{ width: `${layout.itemWidth}px` }}
          >
            <div className="thoughts__card">
              {/* <img src="" alt="" />*/}
              <div className="meta">
                <h4>Lorem Ipsum Dolor</h4>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_782_1145)">
                    <path
                      d="M0 9.54544V4.99998H1.5V8.1818H5V9.54544H0ZM8.5 4.99998V1.81817H5V0.454529H10V4.99998H8.5Z"
                      fill="#A3A3A3"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_782_1145">
                      <rect width="10" height="10" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
