"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { TextMorph } from "torph/react";
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

export function Slider({ projects }) {
  const trackRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [layout, setLayout] = useState({
    inset: 0,
    itemWidth: 0,
    metaInset: 0,
    isMobile: false,
  });
  const dragDistRef = useRef(0);
  const scrollRafTicking = useRef(false);

  useEffect(() => {
    const measure = () => {
      const subgrid = document.querySelector(".subgrid");
      if (!subgrid) return;

      const style = getComputedStyle(subgrid);
      const gap = parseFloat(style.columnGap) || 0;
      const rect = subgrid.getBoundingClientRect();
      const columns =
        parseInt(
          getComputedStyle(document.querySelector(".grid")).getPropertyValue(
            "--columns",
          ),
        ) || 4;
      const colWidth = (rect.width - (columns - 1) * gap) / columns;
      const isDesktop = window.matchMedia("(min-width: 700px)").matches;
      if (isDesktop) {
        setLayout({
          inset: rect.left - 12,
          itemWidth: rect.width + 24,
          metaInset: rect.left + 2 * (colWidth + gap),
          isMobile: false,
        });
      } else {
        const mobileItemWidth = window.innerWidth - 32;
        const mobilePad = (window.innerWidth - mobileItemWidth) / 2;
        setLayout({
          inset: mobilePad,
          itemWidth: mobileItemWidth,
          metaInset: rect.left,
          isMobile: true,
        });
      }
    };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 100);
    };

    measure();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
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
      items[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: layout.isMobile ? "center" : "start",
      });
    },
    [layout.itemWidth, layout.isMobile],
  );

  const updateMobileScales = useCallback((track) => {
    const items = track.querySelectorAll(".slider__item");
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

      const halfItem = rect.width / 2;
      const edgeDist = Math.max(0, dist - halfItem);
      const norm = Math.min(edgeDist / (window.innerWidth * 0.3), 1);
      const inner = item.querySelector(".slider__item-inner");
      if (inner) {
        inner.style.transform = `scale(${1 - norm * 0.05})`;
        inner.style.filter = `brightness(${1 - norm * 0.15})`;
      }
    });

    return closest;
  }, []);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    if (layout.isMobile) {
      if (scrollRafTicking.current) return;
      scrollRafTicking.current = true;
      requestAnimationFrame(() => {
        scrollRafTicking.current = false;
        const t = trackRef.current;
        if (!t) return;
        const closest = updateMobileScales(t);
        setActiveIndex(closest);
      });
      return;
    }

    // Desktop: activate the project as soon as it overlaps the active slot by >50%
    if (scrollRafTicking.current) return;
    scrollRafTicking.current = true;
    requestAnimationFrame(() => {
      scrollRafTicking.current = false;
      const t = trackRef.current;
      if (!t) return;

      const items = t.querySelectorAll(".slider__item");
      const slotLeft = layout.inset;
      const slotRight = layout.inset + layout.itemWidth;

      let bestIndex = -1;
      let bestOverlap = 0;
      items.forEach((item, i) => {
        const rect = item.getBoundingClientRect();
        const overlap = Math.max(
          0,
          Math.min(rect.right, slotRight) - Math.max(rect.left, slotLeft),
        );
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestIndex = i;
        }
      });

      if (bestIndex >= 0 && bestOverlap / layout.itemWidth > 0.5) {
        setActiveIndex(bestIndex);
      }
    });
  }, [layout.inset, layout.itemWidth, layout.isMobile, updateMobileScales]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Apply/clean mobile scales
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (layout.isMobile) {
      requestAnimationFrame(() => updateMobileScales(track));
    } else {
      track.querySelectorAll(".slider__item-inner").forEach((inner) => {
        inner.style.transform = "";
        inner.style.filter = "";
      });
    }
  }, [layout.isMobile, updateMobileScales]);

  const handleItemClick = useCallback(
    (index) => {
      if (index !== activeIndex) {
        scrollToIndex(index);
      }
    },
    [activeIndex, scrollToIndex],
  );

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
    track.style.scrollSnapType = "none";
    track.classList.add("slider__track--dragging");
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

  const handlePointerUp = useCallback(
    (e) => {
      const ds = dragState.current;
      if (!ds.isDragging) return;
      ds.isDragging = false;
      const track = trackRef.current;
      track.releasePointerCapture(e.pointerId);
      track.classList.remove("slider__track--dragging");

      // If barely moved, treat as click
      if (dragDistRef.current < 5) {
        track.style.scrollSnapType = "x mandatory";
        const el = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest(".slider__item");
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
            const dist = Math.abs(
              item.getBoundingClientRect().left - layout.inset,
            );
            if (dist < closestDist) {
              closestDist = dist;
              closest = i;
            }
          });

          const onScrollEnd = () => {
            clearTimeout(fallback);
            track.style.scrollSnapType = "x mandatory";
            track.removeEventListener("scrollend", onScrollEnd);
          };
          const fallback = setTimeout(onScrollEnd, 300);
          track.addEventListener("scrollend", onScrollEnd, { once: true });
          items[closest].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
          });
        }
      };

      requestAnimationFrame(step);
    },
    [layout.inset, handleItemClick],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll(".slider__item");
    const cleanups = [];
    items.forEach((item, i) => {
      const video = item.querySelector("video");
      if (!video) return;
      if (i === activeIndex) {
        video.currentTime = 0;
        video.play();
        const onReady = () => item.classList.add("slider__item--video-ready");
        if (video.readyState >= 2) {
          onReady();
        } else {
          video.addEventListener("canplay", onReady, { once: true });
          cleanups.push(() => video.removeEventListener("canplay", onReady));
        }
      } else {
        video.pause();
        item.classList.remove("slider__item--video-ready");
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeIndex]);

  const active = projects[activeIndex];

  return (
    <motion.div className="slider" variants={staggerItems}>
      <motion.div
        className="slider__track"
        ref={trackRef}
        tabIndex={-1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          paddingLeft: `${layout.inset}px`,
          paddingRight: `${layout.inset}px`,
          scrollPaddingLeft: layout.isMobile ? undefined : `${layout.inset}px`,
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
              role="button"
              tabIndex={0}
              aria-label={project.title}
              style={{ width: `${layout.itemWidth}px` }}
              onClick={() => {
                // Touch clicks (pointer capture doesn't apply to touch)
                if (dragDistRef.current < 5) handleItemClick(i);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleItemClick(i);
                }
              }}
            >
              <div className="slider__item-inner">
                <picture>
                  <source
                    srcSet={img.webpSrcSet}
                    sizes="(min-width: 700px) 840px, calc(100vw - 32px)"
                    type="image/webp"
                  />
                  <img
                    src={img.src}
                    srcSet={img.srcSet}
                    sizes="(min-width: 700px) 840px, calc(100vw - 32px)"
                    alt={img.alt || project.title}
                    draggable={false}
                    fetchPriority={i === 0 ? "high" : undefined}
                    loading={i <= 1 ? "eager" : "lazy"}
                    decoding={i <= 1 ? "sync" : "async"}
                    style={
                      img.base64
                        ? {
                            backgroundImage: `url(${img.base64})`,
                            backgroundSize: "cover",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
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
            </motion.div>
          );
        })}
      </motion.div>
      <motion.div
        className="slider__meta"
        style={{
          paddingLeft: `${layout.metaInset}px`,
          paddingRight: `${layout.metaInset}px`,
        }}
        variants={itemFadeIn}
      >
        <div className="slider__meta-inner">
          <TextMorph as="h3">{active?.title}</TextMorph>
          <br />
          <TextMorph as="p">{active?.typeYear}</TextMorph>
        </div>
      </motion.div>
    </motion.div>
  );
}
