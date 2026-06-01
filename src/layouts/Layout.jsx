"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Nav from "@/components/Nav";

const stagger = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function Layout({ children }) {
  // Start the reveal one frame after mount rather than on mount. On a fresh
  // load the frame loop's first delta can be large (delayed hydration/JS),
  // which makes a mount animation jump partway through ("fast-forward"). By
  // flipping initial -> animate via rAF, the loop is already warm and the
  // staggered reveal plays in full on every refresh.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      className="subgrid app"
      variants={stagger}
      initial="initial"
      animate={revealed ? "animate" : "initial"}
    >
      <Nav />
      {children}
    </motion.div>
  );
}
