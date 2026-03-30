"use client";

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
  return (
    <motion.div
      className="subgrid app"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <Nav />
      {children}
    </motion.div>
  );
}
