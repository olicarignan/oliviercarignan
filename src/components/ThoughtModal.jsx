"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "motion/react";

function renderDast(node) {
  if (!node) return null;
  if (typeof node === "string") return node;

  if (node.type === "root" || node.type === "document") {
    return node.children?.map((child, i) => renderDast({ ...child, key: i }));
  }

  const children = node.children?.map((child, i) =>
    renderDast({ ...child, key: i }),
  );
  const key = node.key;

  switch (node.type) {
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading": {
      const Tag = `h${node.level || 2}`;
      return <Tag key={key}>{children}</Tag>;
    }
    case "list":
      return node.style === "numbered" ? (
        <ol key={key}>{children}</ol>
      ) : (
        <ul key={key}>{children}</ul>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "code":
      return (
        <pre key={key}>
          <code>{node.code}</code>
        </pre>
      );
    case "thematicBreak":
      return <hr key={key} />;
    case "link":
      return (
        <a key={key} href={node.url} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    case "span": {
      const marks = node.marks || [];
      let el = node.value || "";
      for (const mark of marks) {
        switch (mark) {
          case "strong":
            el = <strong>{el}</strong>;
            break;
          case "emphasis":
            el = <em>{el}</em>;
            break;
          case "underline":
            el = <u>{el}</u>;
            break;
          case "strikethrough":
            el = <s>{el}</s>;
            break;
          case "code":
            el = <code>{el}</code>;
            break;
          case "highlight":
            el = <mark>{el}</mark>;
            break;
        }
      }
      return <span key={key}>{el}</span>;
    }
    default:
      return children || null;
  }
}

const panelTransition = {
  y: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  opacity: { duration: 0.3 },
};

export function ThoughtModal({ thought, onClose }) {
  const img = thought.featuredImage?.responsiveImage;
  const content = thought.content?.value?.document;
  const date = new Date(thought.date);
  const panelControls = useAnimation();
  const dragRef = useRef({
    startY: 0,
    currentY: 0,
    dragging: false,
    engaged: false,
  });
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Mobile: overscroll-to-dismiss on the scroll container
  useEffect(() => {
    if (!isMobile) return;
    const scroll = scrollRef.current;
    if (!scroll) return;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      dragRef.current = {
        startY: touch.clientY,
        currentY: touch.clientY,
        dragging: true,
        engaged: false,
      };
    };

    const onTouchMove = (e) => {
      const d = dragRef.current;
      if (!d.dragging) return;
      const touch = e.touches[0];
      d.currentY = touch.clientY;
      const dy = touch.clientY - d.startY;

      // Engage drag-to-dismiss when at top and pulling down
      if (!d.engaged) {
        if (scroll.scrollTop <= 0 && dy > 0) {
          d.engaged = true;
          d.startY = touch.clientY; // reset start so offset begins from 0
        } else {
          return; // let normal scroll happen
        }
      }

      const offset = Math.max(0, touch.clientY - d.startY);
      if (offset > 0) {
        e.preventDefault(); // prevent scroll while dragging panel
      }
      if (panelRef.current) {
        panelRef.current.style.transform = `translateY(${offset}px)`;
        panelRef.current.style.transition = "none";
      }
    };

    const onTouchEnd = () => {
      const d = dragRef.current;
      if (!d.dragging) return;
      d.dragging = false;

      if (!d.engaged) return;

      const dy = d.currentY - d.startY;
      if (dy > 120) {
        panelControls.start({ y: "100%" }).then(onClose);
      } else if (panelRef.current) {
        panelRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
        panelRef.current.style.transform = "translateY(0)";
      }
    };

    scroll.addEventListener("touchstart", onTouchStart, { passive: true });
    scroll.addEventListener("touchmove", onTouchMove, { passive: false });
    scroll.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      scroll.removeEventListener("touchstart", onTouchStart);
      scroll.removeEventListener("touchmove", onTouchMove);
      scroll.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, onClose, panelControls]);

  return (
    <div className="thought-modal">
      <motion.div
        className="thought-modal__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />
      <div className="thought-modal__scroll" ref={scrollRef} onClick={onClose}>
        <motion.div
          className="thought-modal__positioner grid"
          ref={panelRef}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={panelTransition}
        >
          <div
            className="thought-modal__card grid"
            onClick={(e) => e.stopPropagation()}
          >
            {isMobile && (
              <div className="thought-modal__drag-handle">
                <div className="thought-modal__drag-line" />
              </div>
            )}
            <div className="thought-modal__card__inner subgrid">
              <div className="thought-modal__image">
                {img && (
                  <picture>
                    <source srcSet={img.webpSrcSet} type="image/webp" />
                    <img
                      src={img.src}
                      srcSet={img.srcSet}
                      alt={img.alt || thought.title}
                    />
                  </picture>
                )}
                <div className="thought-modal__image-overlay" />
              </div>
              <div className="thought-modal__body">
                <div className="thought-modal__meta">
                  <h2 className="thought-modal__title">{thought.title}</h2>
                  <span>
                    {date.toLocaleDateString("en-CA", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="thought-modal__body-inner">
                  {content && renderDast(content)}
                </div>
              </div>
            </div>
          </div>
          {!isMobile && (
            <motion.button
              className="thought-modal__close"
              onClick={onClose}
              aria-label="Close"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.5, duration: 0.2 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
