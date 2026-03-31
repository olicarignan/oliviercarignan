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
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const scrollToIndex = useCallback(
    (index) => {
      const track = trackRef.current;
      if (!track || !layout.itemWidth) return;
      const items = track.querySelectorAll(".slider__item");
      if (!items[index]) return;
      items[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    },
    [layout.itemWidth]
  );

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        const next = Math.min(activeIndex + 1, projects.length - 1);
        if (next !== activeIndex) scrollToIndex(next);
      } else if (e.key === "ArrowLeft") {
        const prev = Math.max(activeIndex - 1, 0);
        if (prev !== activeIndex) scrollToIndex(prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, projects.length, scrollToIndex]);

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === "touch") return;
    const track = trackRef.current;
    if (!track) return;
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
    trackRef.current.scrollLeft = ds.scrollLeft - (e.clientX - ds.startX);
  }, []);

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.isDragging = false;
    const track = trackRef.current;
    track.releasePointerCapture(e.pointerId);

    // Inertia scroll
    let velocity = -ds.velocity * 1000; // px per second
    const friction = 0.95;
    let lastTime = performance.now();

    const step = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      velocity *= friction;
      track.scrollLeft += velocity * dt;

      if (Math.abs(velocity) > 20) {
        requestAnimationFrame(step);
      } else {
        // Snap to nearest item
        const items = track.querySelectorAll(".slider__item");
        let closest = 0;
        let closestDist = Infinity;
        items.forEach((item, i) => {
          const dist = Math.abs(item.getBoundingClientRect().left - layout.inset);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        items[closest].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        setTimeout(() => {
          track.style.scrollSnapType = "x mandatory";
          setIsDragging(false);
        }, 500);
      }
    };

    requestAnimationFrame(step);
  }, [layout.inset]);

  const active = projects[activeIndex];

  return (
    <motion.div className="slider" variants={staggerItems}>
      <motion.div
        className="slider__track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          paddingLeft: `${layout.inset}px`,
          paddingRight: `${layout.inset}px`,
          scrollPaddingLeft: `${layout.inset}px`,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "pan-x",
        }}
      >
        {projects.map((project, i) => {
          const img = project.featuredImage.responsiveImage;
          const videoUrl = project.video?.url;
          return (
            <motion.div
              key={project.id}
              className="slider__item"
              variants={itemFadeIn}
              style={{ width: `${layout.itemWidth}px` }}
              onMouseEnter={(e) => {
                const video = e.currentTarget.querySelector("video");
                if (video) {
                  video.currentTime = 0;
                  video.play();
                }
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget.querySelector("video");
                if (video) {
                  video.pause();
                }
              }}
            >
              <picture>
                <source srcSet={img.webpSrcSet} type="image/webp" />
                <img
                  src={img.src}
                  srcSet={img.srcSet}
                  alt={img.alt || project.title}
                  draggable={false}
                  fetchPriority={i === 0 ? "high" : undefined}
                  loading={i <= 1 ? "eager" : "lazy"}
                  decoding={i <= 1 ? "sync" : "async"}
                  style={img.base64 ? {
                    backgroundImage: `url(${img.base64})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  } : undefined}
                />
              </picture>
              {videoUrl && (
                <video
                  src={videoUrl}
                  muted
                  playsInline
                  loop
                  preload="none"
                  draggable={false}
                />
              )}
            </motion.div>
          );
        })}
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
            opacity: hasLoaded && (isScrolling || isDragging) ? 0 : 1,
            filter: hasLoaded && (isScrolling || isDragging) ? "blur(4px)" : "blur(0px)",
            transform: hasLoaded && (isScrolling || isDragging) ? "translateY(8px)" : "translateY(0)",
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
