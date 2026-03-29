"use client";

import { motion } from "motion/react";

const fadeIn = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0, 0.55, 0.45, 1] },
  },
};

export default function Nav() {
  return (
    <motion.nav className="nav" variants={fadeIn}>
      <h1>Olivier Carignan</h1>
      <h2>Designer, Engineer &amp; Founder</h2>
    </motion.nav>
  );
}
