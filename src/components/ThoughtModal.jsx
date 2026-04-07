"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

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

const layoutTransition = {
  layout: { duration: 0.5, ease: [0.4, 0, 0, 1] },
};

const bodyTransition = {
  height: { delay: 0.4, duration: 0.45, ease: [0.4, 0, 0, 1] },
  opacity: { delay: 0.55, duration: 0.3 },
};

export function ThoughtModal({ thought, layoutId, onClose }) {
  const img = thought.featuredImage?.responsiveImage;
  const content = thought.content?.value?.document;
  const date = new Date(thought.date);

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

  return (
    <div className="thought-modal">
      <motion.div
        className="thought-modal__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        onClick={onClose}
      />
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
      <div className="thought-modal__scroll" onClick={onClose}>
        <div className="thought-modal__positioner grid">
          <div
            className="thought-modal__card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="thought-modal__card__inner subgrid">
              <motion.div
                className="thought-modal__image"
                layoutId={layoutId}
                transition={layoutTransition}
              >
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
              </motion.div>
              <motion.div
                className="thought-modal__body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={bodyTransition}
              >
                <div className="thought-modal__meta">
                  <h2 className="thought-modal__title">{thought.title}</h2>
                  <span>{date.toLocaleDateString("en-CA", {month: "long", year: "numeric"})}</span>
                </div>
                <div className="thought-modal__body-inner">
                  {content && renderDast(content)}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
