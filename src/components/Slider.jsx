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
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0, 0.55, 0.45, 1] },
  },
};

const metaStagger = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const metaItemMorph = {
  initial: { opacity: 0, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0, 0.55, 0.45, 1] },
  },
};

export function Slider({ projects }) {
  const trackRef = useRef(null);
  const scrollTimer = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [layout, setLayout] = useState({ inset: 0, itemWidth: 0, metaInset: 0, isMobile: false });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sliderVideosHidden, setSliderVideosHidden] = useState(false);
  const dragDistRef = useRef(0);
  const pendingLightbox = useRef(null);
  const externalScroll = useRef(false);
  const activeTransition = useRef(null);
  const scrollRafTicking = useRef(false);

  useEffect(() => {
    const measure = () => {
      const subgrid = document.querySelector(".subgrid");
      if (!subgrid) return;

      const style = getComputedStyle(subgrid);
      const gap = parseFloat(style.columnGap) || 0;
      const rect = subgrid.getBoundingClientRect();
      const columns = parseInt(getComputedStyle(document.querySelector(".grid")).getPropertyValue("--columns")) || 4;
      const colWidth = (rect.width - (columns - 1) * gap) / columns;
      const isDesktop = window.matchMedia("(min-width: 700px)").matches;
      if (isDesktop) {
        setLayout({
          inset: rect.left - 12,
          itemWidth: rect.width + 24,
          metaInset: rect.left + colWidth + gap,
          isMobile: false,
        });
      } else {
        const mobileItemWidth = rect.width + 24;
        const mobilePad = (window.innerWidth - mobileItemWidth) / 2;
        setLayout({
          inset: mobilePad,
          itemWidth: mobileItemWidth,
          metaInset: mobilePad + 12,
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
      items[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: layout.isMobile ? "center" : "start" });
    },
    [layout.itemWidth, layout.isMobile]
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

    // Skip detection when scroll was triggered by lightbox sync
    if (externalScroll.current) return;

    if (layout.isMobile) {
      if (scrollRafTicking.current) return;
      scrollRafTicking.current = true;
      requestAnimationFrame(() => {
        scrollRafTicking.current = false;
        const t = trackRef.current;
        if (!t) return;
        const closest = updateMobileScales(t);
        setActiveIndex(closest);
        clearTimeout(scrollTimer.current);
      });
      return;
    }

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
    }, 150);
  }, [layout.inset, layout.isMobile, updateMobileScales]);

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


  const openLightbox = useCallback((index) => {
    const sliderItems = trackRef.current?.querySelectorAll(".slider__item");
    if (!sliderItems?.[index]) return;
    if (activeTransition.current) return;

    if (document.startViewTransition) {
      // Fade out shadow before snapshot
      sliderItems[index].classList.add("slider__item--transitioning");

      // Old snapshot: slider item has the name
      sliderItems[index].style.viewTransitionName = "slider-active";
      document.documentElement.style.viewTransitionName = "none";

      const transition = document.startViewTransition(() => {
        // Remove from slider item so lightbox active item (via CSS) becomes the new snapshot
        sliderItems[index].style.viewTransitionName = "";
        flushSync(() => setLightboxOpen(true));
      });
      activeTransition.current = transition;

      transition.finished.then(() => {
        activeTransition.current = null;
        sliderItems[index].classList.remove("slider__item--transitioning");
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
    const cleanups = [];
    items.forEach((item, i) => {
      const video = item.querySelector("video");
      if (!video) return;
      if (sliderVideosHidden) {
        video.pause();
        video.style.visibility = "hidden";
        item.classList.remove("slider__item--video-ready");
      } else {
        video.style.visibility = "";
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
      }
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeIndex, sliderVideosHidden]);

  const closeLightbox = useCallback(() => {
    if (activeTransition.current) return;
    const sliderItems = trackRef.current?.querySelectorAll(".slider__item");
    if (!sliderItems?.[activeIndex]) {
      setLightboxOpen(false);
      return;
    }

    // Step 1: Fade out neighbors and backdrop
    const lightboxEl = document.querySelector(".lightbox");
    if (lightboxEl) lightboxEl.classList.add("lightbox--closing");

    const runViewTransition = () => {
      if (activeTransition.current) return;
      if (document.startViewTransition) {
        // Restore slider videos before snapshot so they appear in the capture
        sliderItems.forEach((item) => {
          const video = item.querySelector("video");
          if (video) video.style.visibility = "";
        });

        // Old snapshot: lightbox active item has the name via CSS
        document.documentElement.style.viewTransitionName = "none";

        const transition = document.startViewTransition(() => {
          // Remove name from lightbox item so it doesn't conflict
          const lbActive = document.querySelector(".lightbox__item--active");
          if (lbActive) lbActive.style.viewTransitionName = "none";

          // Hide lightbox immediately so its exit animation doesn't interfere
          const lightboxRoot = document.querySelector(".lightbox");
          if (lightboxRoot) lightboxRoot.style.display = "none";

          // New snapshot: slider item gets the name
          sliderItems[activeIndex].style.viewTransitionName = "slider-active";
          flushSync(() => setLightboxOpen(false));
        });
        activeTransition.current = transition;

        transition.finished.then(() => {
          activeTransition.current = null;
          sliderItems[activeIndex].style.viewTransitionName = "";
          document.documentElement.style.viewTransitionName = "";
        });
      } else {
        setLightboxOpen(false);
      }
    };

    // Step 2: Wait for fade-out to finish, then run view transition
    if (lightboxEl) {
      setTimeout(runViewTransition, 350);
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
              style={{ width: `${layout.itemWidth}px`, cursor: "zoom-in" }}
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
                  <source srcSet={img.webpSrcSet} sizes="(min-width: 700px) 628px, 82vw" type="image/webp" />
                  <img
                    src={img.src}
                    srcSet={img.srcSet}
                    sizes="(min-width: 700px) 628px, 82vw"
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
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <motion.div
        className="slider__meta"
        style={{ paddingLeft: `${layout.metaInset}px` }}
        variants={itemFadeIn}
        onAnimationComplete={() => setHasLoaded(true)}
      >
        <div className="slider__meta-inner">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeIndex}
              initial={hasLoaded ? "initial" : false}
              animate="animate"
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] } }}
              variants={metaStagger}
            >
              <motion.h3 variants={metaItemMorph}>{active?.title}</motion.h3>
              <motion.p variants={metaItemMorph}>{active?.typeYear}</motion.p>
            </motion.div>
          </AnimatePresence>
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
