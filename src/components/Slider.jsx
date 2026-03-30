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
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0, 0.55, 0.45, 1] },
  },
};

export function Slider({ projects }) {
  const trackRef = useRef(null);
  const scrollTimer = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [layout, setLayout] = useState({ inset: 0, itemWidth: 0 });

  useEffect(() => {
    const measure = () => {
      const subgrid = document.querySelector(".subgrid");
      if (!subgrid) return;

      const style = getComputedStyle(subgrid);
      const gap = parseFloat(style.columnGap) || 0;
      const rect = subgrid.getBoundingClientRect();
      setLayout({
        inset: rect.left - 12,
        itemWidth: rect.width + 24,
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
    const track = trackRef.current;
    if (!track) return;

    setIsScrolling(true);
    clearTimeout(scrollTimer.current);

    scrollTimer.current = setTimeout(() => {
      const items = track.querySelectorAll(".slider__item");
      const snapPoint = layout.inset;

      let closest = 0;
      let closestDist = Infinity;

      items.forEach((item, i) => {
        const dist = Math.abs(item.getBoundingClientRect().left - snapPoint);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });

      setActiveIndex(closest);
      setIsScrolling(false);
    }, 150);
  }, [layout.inset]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const active = projects[activeIndex];

  return (
    <motion.div className="slider" variants={staggerItems}>
      <motion.div
        className="slider__track"
        ref={trackRef}
        style={{
          paddingLeft: `${layout.inset}px`,
          paddingRight: `${layout.inset}px`,
          scrollPaddingLeft: `${layout.inset}px`,
        }}
      >
        {projects.map((project) => (
          <motion.div
            key={project.id}
            className="slider__item"
            variants={itemFadeIn}
            style={{ width: `${layout.itemWidth}px` }}
          >
            <img src={project.featuredImage.url} alt={project.title} />
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        className="slider__meta"
        style={{ paddingLeft: `${layout.inset}px` }}
        variants={itemFadeIn}
        onAnimationComplete={() => setHasLoaded(true)}
      >
        <div
          className="slider__meta-inner"
          style={{
            opacity: hasLoaded && isScrolling ? 0 : 1,
            filter: hasLoaded && isScrolling ? "blur(4px)" : "blur(0px)",
            transform: hasLoaded && isScrolling ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease",
          }}
        >
          <h3>{active?.title}</h3>
          <p>{active?.typeYear}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
