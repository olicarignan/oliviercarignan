"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

export function Lightbox({ projects, activeIndex: initialIndex, onActiveIndexChange, onClose }) {
  const trackRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const dragDistRef = useRef(0);
  const hasInitialized = useRef(false);
  const [neighborsRevealed, setNeighborsRevealed] = useState(false);
  const revealedRef = useRef(false);

  // Reveal neighbors after view transition finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      setNeighborsRevealed(true);
      revealedRef.current = true;
      // Set initial dim state
      const track = trackRef.current;
      if (track) {
        const items = track.querySelectorAll(".lightbox__item");
        const center = window.innerWidth / 2;
        items.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.left + rect.width / 2;
          const dist = Math.abs(itemCenter - center);
          const halfItem = rect.width / 2;
          const edgeDist = Math.max(0, dist - halfItem);
          const norm = Math.min(edgeDist / (window.innerWidth * 0.3), 1);
          item.style.filter = `blur(0px) brightness(${1 - norm * 0.4})`;
          item.style.transform = `scale(${1 - norm * 0.08})`;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Scroll to initial position on mount
  useEffect(() => {
    const track = trackRef.current;
    if (!track || hasInitialized.current) return;
    hasInitialized.current = true;
    const items = track.querySelectorAll(".lightbox__item");
    if (items[initialIndex]) {
      items[initialIndex].scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
    }
  }, [initialIndex]);

  // Scroll handler — report index eagerly on every frame, settle internal state after debounce
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const items = track.querySelectorAll(".lightbox__item");
    const center = window.innerWidth / 2;

    let closest = 0;
    let closestDist = Infinity;
    items.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const dist = Math.abs(itemCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }

      // Dim and scale items based on distance from center
      if (revealedRef.current) {
        const halfItem = rect.width / 2;
        const edgeDist = Math.max(0, dist - halfItem);
        const norm = Math.min(edgeDist / (window.innerWidth * 0.3), 1);
        item.style.filter = `blur(0px) brightness(${1 - norm * 0.4})`;
        item.style.transform = `scale(${1 - norm * 0.08})`;
      }
    });

    // Report to parent immediately so slider stays in sync
    onActiveIndexChange(closest);
    setActiveIndex(closest);
  }, [onActiveIndexChange]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll(".lightbox__item");
    if (!items[index]) return;
    items[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        const next = Math.min(activeIndex + 1, projects.length - 1);
        if (next !== activeIndex) scrollToIndex(next);
      } else if (e.key === "ArrowLeft") {
        const prev = Math.max(activeIndex - 1, 0);
        if (prev !== activeIndex) scrollToIndex(prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, projects.length, onClose, scrollToIndex]);

  // Desktop drag handling
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
    if (dt > 0) ds.velocity = dx / dt;
    ds.prevX = e.clientX;
    ds.prevTime = now;
    dragDistRef.current = Math.abs(e.clientX - ds.startX);
    const track = trackRef.current;
    const newScroll = ds.scrollLeft - (e.clientX - ds.startX);

    // Rubber-band at boundaries
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (newScroll < 0) {
      track.scrollLeft = newScroll * 0.2;
    } else if (newScroll > maxScroll) {
      track.scrollLeft = maxScroll + (newScroll - maxScroll) * 0.2;
    } else {
      track.scrollLeft = newScroll;
    }
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
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".lightbox__item");
      if (el) {
        const items = Array.from(track.querySelectorAll(".lightbox__item"));
        const index = items.indexOf(el);
        if (index >= 0) {
          if (index === activeIndex) onClose();
          else scrollToIndex(index);
        }
      }
      return;
    }

    // Inertia scroll
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
        const items = track.querySelectorAll(".lightbox__item");
        const center = window.innerWidth / 2;
        let closest = 0;
        let closestDist = Infinity;
        items.forEach((item, i) => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.left + rect.width / 2;
          const dist = Math.abs(itemCenter - center);
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
        items[closest].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    };

    requestAnimationFrame(step);
  }, [activeIndex, onClose, scrollToIndex]);

  // Video autoplay
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll(".lightbox__item");
    const cleanups = [];
    items.forEach((item, i) => {
      const video = item.querySelector("video");
      if (!video) return;
      if (i === activeIndex) {
        const startVideo = () => {
          video.currentTime = 0;
          video.play();
          const onReady = () => item.classList.add("lightbox__item--video-ready");
          if (video.readyState >= 2) {
            onReady();
          } else {
            video.addEventListener("canplay", onReady, { once: true });
            cleanups.push(() => video.removeEventListener("canplay", onReady));
          }
        };
        const timer = setTimeout(startVideo, 300);
        cleanups.push(() => clearTimeout(timer));
      } else {
        video.pause();
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeIndex]);

  // Click handler for touch (pointer capture skips touch)
  const handleItemClick = useCallback((index) => {
    if (dragDistRef.current >= 5) return;
    if (index === activeIndex) onClose();
    else scrollToIndex(index);
  }, [activeIndex, onClose, scrollToIndex]);

  return (
    <div className={`lightbox${neighborsRevealed ? " lightbox--revealed" : ""}`}>
      <motion.div
        className="lightbox__backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <div
        className="lightbox__track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={(e) => {
          if (dragDistRef.current >= 5) return;
          const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".lightbox__item");
          if (!el) onClose();
        }}
        style={{
          touchAction: "pan-x",
        }}
      >
        {projects.map((project, i) => {
          const img = project.featuredImage.responsiveImage;
          const videoUrl = project.video?.url;
          const isActive = i === activeIndex;
          const dist = Math.abs(i - activeIndex);
          return (
            <div
              key={project.id}
              className={`lightbox__item${isActive ? " lightbox__item--active" : ""}`}
              style={!isActive ? { transitionDelay: `${dist * 0.06}s` } : undefined}
              onClick={() => handleItemClick(i)}
            >
              <picture>
                <source srcSet={img.webpSrcSet} type="image/webp" />
                <img
                  src={img.src}
                  srcSet={img.srcSet}
                  sizes="84vw"
                  alt={img.alt || project.title}
                  draggable={false}
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
            </div>
          );
        })}
      </div>
      <button className="lightbox__close" onClick={onClose} aria-label="Close">
        Close
      </button>
    </div>
  );
}
