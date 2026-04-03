"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Lightbox } from "./Lightbox";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sliderVideosHidden, setSliderVideosHidden] = useState(false);
  const dragDistRef = useRef(0);
  const pendingLightbox = useRef(null);
  const externalScroll = useRef(false);

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

    // Skip detection when scroll was triggered by lightbox sync
    if (externalScroll.current) return;

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
    if (lightboxOpen) return;
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
  }, [activeIndex, projects.length, scrollToIndex, lightboxOpen]);

  const openLightbox = useCallback((index) => {
    const sliderItems = trackRef.current?.querySelectorAll(".slider__item");
    if (!sliderItems?.[index]) return;

    if (document.startViewTransition) {
      // Old snapshot: slider item has the name
      sliderItems[index].style.viewTransitionName = "slider-active";
      document.documentElement.style.viewTransitionName = "none";

      const transition = document.startViewTransition(() => {
        // Remove from slider item so lightbox active item (via CSS) becomes the new snapshot
        sliderItems[index].style.viewTransitionName = "";
        flushSync(() => setLightboxOpen(true));
      });

      transition.finished.then(() => {
        document.documentElement.style.viewTransitionName = "";
      });
    } else {
      setLightboxOpen(true);
    }
  }, []);

  const handleItemClick = useCallback((index) => {
    if (index === activeIndex) {
      openLightbox(index);
    } else {
      pendingLightbox.current = index;
      scrollToIndex(index);
    }
  }, [activeIndex, openLightbox, scrollToIndex]);

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

    // If barely moved, treat as click
    if (dragDistRef.current < 5) {
      track.style.scrollSnapType = "x mandatory";
      setIsDragging(false);
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".slider__item");
      if (el) {
        const items = Array.from(track.querySelectorAll(".slider__item"));
        const index = items.indexOf(el);
        if (index >= 0) handleItemClick(index);
      }
      return;
    }

    // Inertia scroll
    let velocity = -ds.velocity * 1000; // px per second
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

        const onScrollEnd = () => {
          clearTimeout(fallback);
          track.style.scrollSnapType = "x mandatory";
          setIsDragging(false);
          track.removeEventListener("scrollend", onScrollEnd);
        };
        const fallback = setTimeout(onScrollEnd, 300);
        track.addEventListener("scrollend", onScrollEnd, { once: true });
        items[closest].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    };

    requestAnimationFrame(step);
  }, [layout.inset, handleItemClick]);

  // Hide slider videos after backdrop fades in, restore on close
  useEffect(() => {
    if (lightboxOpen) {
      const timer = setTimeout(() => setSliderVideosHidden(true), 300);
      return () => clearTimeout(timer);
    } else {
      setSliderVideosHidden(false);
    }
  }, [lightboxOpen]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll(".slider__item");
    items.forEach((item, i) => {
      const video = item.querySelector("video");
      if (!video) return;
      if (sliderVideosHidden) {
        video.pause();
        video.style.visibility = "hidden";
      } else {
        video.style.visibility = "";
        if (i === activeIndex) {
          video.currentTime = 0;
          video.play();
        } else {
          video.pause();
        }
      }
    });
  }, [activeIndex, sliderVideosHidden]);

  const closeLightbox = useCallback(() => {
    const sliderItems = trackRef.current?.querySelectorAll(".slider__item");
    if (!sliderItems?.[activeIndex]) {
      setLightboxOpen(false);
      return;
    }

    // Step 1: Fade out neighbors and backdrop
    const lightboxEl = document.querySelector(".lightbox");
    if (lightboxEl) lightboxEl.classList.add("lightbox--closing");

    const runViewTransition = () => {
      if (document.startViewTransition) {
        // Old snapshot: lightbox active item has the name via CSS
        document.documentElement.style.viewTransitionName = "none";

        const transition = document.startViewTransition(() => {
          // Remove name from lightbox item so it doesn't conflict
          const lbActive = document.querySelector(".lightbox__item--active");
          if (lbActive) lbActive.style.viewTransitionName = "none";

          // New snapshot: slider item gets the name
          sliderItems[activeIndex].style.viewTransitionName = "slider-active";
          flushSync(() => setLightboxOpen(false));
        });

        transition.finished.then(() => {
          sliderItems[activeIndex].style.viewTransitionName = "";
          document.documentElement.style.viewTransitionName = "";
        });
      } else {
        setLightboxOpen(false);
      }
    };

    // Step 2: Wait for fade-out to finish, then run view transition
    if (lightboxEl) {
      setTimeout(runViewTransition, 300);
    } else {
      runViewTransition();
    }
  }, [activeIndex]);

  // Open lightbox after pending scroll settles
  useEffect(() => {
    if (pendingLightbox.current !== null && activeIndex === pendingLightbox.current) {
      const idx = pendingLightbox.current;
      pendingLightbox.current = null;
      // Small delay to let scroll fully settle
      requestAnimationFrame(() => openLightbox(idx));
    }
  }, [activeIndex, openLightbox]);

  const handleLightboxActiveChange = useCallback((index) => {
    setActiveIndex(index);
    externalScroll.current = true;
    scrollToIndex(index);
    // Clear flag after scroll settles
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      externalScroll.current = false;
    }, 300);
  }, [scrollToIndex]);

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
          touchAction: "pan-x pan-y",
        }}
      >
        {projects.map((project, i) => {
          const img = project.featuredImage.responsiveImage;
          const videoUrl = project.video?.url;
          return (
            <motion.div
              key={project.id}
              className={`slider__item${i === activeIndex ? " slider__item--active" : ""}`}
              variants={itemFadeIn}
              style={{ width: `${layout.itemWidth}px`, cursor: "zoom-in" }}
              onClick={() => {
                // Touch clicks (pointer capture doesn't apply to touch)
                if (dragDistRef.current < 5) handleItemClick(i);
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
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            projects={projects}
            activeIndex={activeIndex}
            onActiveIndexChange={handleLightboxActiveChange}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
