"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "motion/react";
import { ThoughtModal } from "./ThoughtModal";
import { handleTiltMove, handleTiltLeave } from "../utils/tilt";

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

export function ThoughtsSlider({ thoughts = [] }) {
  const router = useRouter();
  const trackRef = useRef(null);
  const scrollTimer = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragDistRef = useRef(0);
  const [layout, setLayout] = useState({ inset: 0, itemWidth: 0 });

  const thoughtParam = router.query.thought;
  const selectedThought = thoughtParam
    ? thoughts.find((t) => t.slug === thoughtParam) || null
    : null;

  const setSelectedThought = useCallback(
    (thought) => {
      if (thought) {
        router.push({ query: { thought: thought.slug } }, undefined, {
          shallow: true,
        });
      } else {
        router.push({ pathname: router.pathname }, undefined, {
          shallow: true,
        });
      }
    },
    [router],
  );

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
      const isDesktop = window.matchMedia("(min-width: 700px)").matches;

      let cardWidth;
      if (isDesktop) {
        cardWidth = 4 * colWidth + 3 * subgridGap;
      } else {
        cardWidth = 3 * colWidth + 2 * subgridGap;
      }

      setLayout({
        inset: rect.left,
        itemWidth: cardWidth,
      });
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

  const scrollRafTicking = useRef(false);
  const handleScroll = useCallback(() => {
    if (scrollRafTicking.current) return;
    scrollRafTicking.current = true;
    requestAnimationFrame(() => {
      scrollRafTicking.current = false;
      setIsScrolling(true);
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    });
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

  const handlePointerUp = useCallback(
    (e) => {
      const ds = dragState.current;
      if (!ds.isDragging) return;
      ds.isDragging = false;
      const track = trackRef.current;
      track.releasePointerCapture(e.pointerId);

      if (dragDistRef.current < 5) {
        track.style.scrollSnapType = "x mandatory";
        setIsDragging(false);
        const el = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest(".thoughts__item");
        if (el) {
          const items = Array.from(track.querySelectorAll(".thoughts__item"));
          const index = items.indexOf(el);
          if (index >= 0 && thoughts[index]) {
            setSelectedThought(thoughts[index]);
          }
        }
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
    },
    [thoughts],
  );

  const handleCardClick = useCallback((thought) => {
    if (dragDistRef.current >= 5) return;
    setSelectedThought(thought);
  }, []);

  return (
    <>
      <motion.div className="thoughts" variants={staggerItems}>
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
          {thoughts.map((thought, i) => {
            const date = new Date(thought.date);

            const img = thought.featuredImage?.responsiveImage;
            return (
              <motion.div
                key={thought.id}
                className="thoughts__item"
                variants={itemFadeIn}
                style={{
                  width: `${layout.itemWidth}px`,
                }}
              >
                <div
                  className="thoughts__card"
                  role="button"
                  tabIndex={0}
                  aria-label={thought.title}
                  onClick={() => handleCardClick(thought)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(thought);
                    }
                  }}
                  onMouseMove={handleTiltMove}
                  onMouseLeave={handleTiltLeave}
                >
                  {img && (
                    <picture>
                      <source
                        srcSet={img.webpSrcSet}
                        sizes="(min-width: 700px) 400px, 75vw"
                        type="image/webp"
                      />
                      <img
                        src={img.src}
                        srcSet={img.srcSet}
                        sizes="(min-width: 700px) 400px, 75vw"
                        alt={img.alt || thought.title}
                        draggable={false}
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
                  )}
                  <div className="thoughts__card-overlay" />
                  <div className="meta">
                    <div className="meta__text">
                      <h4>{thought.title}</h4>
                      <span>
                        {date.toLocaleDateString("en-CA", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_843_1349)">
                        <path
                          d="M4 13.5455V9.00004H5.5V12.1819H9V13.5455H4ZM12.5 9.00004V5.81823H9V4.45459H14V9.00004H12.5Z"
                          fill="#FAFAFA"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_843_1349">
                          <rect
                            width="10"
                            height="10"
                            fill="white"
                            transform="translate(4 4)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {selectedThought && (
          <ThoughtModal
            thought={selectedThought}
            onClose={() => setSelectedThought(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
