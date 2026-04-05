"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

const BLOBS = [
  { className: "blob blob--rose",    x: "15%",  y: "60%", size: "52rem" },
  { className: "blob blob--sky",     x: "72%",  y: "40%", size: "44rem" },
  { className: "blob blob--amber",   x: "48%",  y: "75%", size: "38rem" },
  { className: "blob blob--violet",  x: "28%",  y: "30%", size: "46rem" },
  { className: "blob blob--emerald", x: "80%",  y: "70%", size: "36rem" },
];

// How far from the bottom (0–1 scroll progress) the reveal starts
const REVEAL_START = 0.75;

export function ScrollGradients() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = Observer.create({
      type: "scroll",
      onChangeY(self) {
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

        // 0 → 1 as scroll progress moves from REVEAL_START to 1
        const revealProgress = Math.max(
          0,
          Math.min(1, (progress - REVEAL_START) / (1 - REVEAL_START))
        );

        // velocityY is px/s — scale down for a subtle inertia offset
        const inertiaY = self.velocityY * 0.004;

        // Blobs start 40px below their natural position and rise into place
        const baseY = (1 - revealProgress) * 40 + inertiaY;

        container.style.opacity = revealProgress.toFixed(4);
        container.style.transform = `translateY(${baseY.toFixed(2)}px)`;
      },
    });

    return () => observer.kill();
  }, []);

  return (
    <div className="scroll-gradients" ref={containerRef} aria-hidden="true">
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className={blob.className}
          style={{
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
          }}
        />
      ))}
    </div>
  );
}
