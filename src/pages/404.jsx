import { motion } from "motion/react";
import { House } from "lucide-react";
import Layout from "@/layouts/Layout";
import { IconLink } from "@/components/IconLink";

const fadeIn = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0, 0.55, 0.45, 1] },
  },
};

export default function NotFound() {
  return (
    <Layout>
      <motion.main className="home" variants={fadeIn}>
        <p>
          <IconLink isInternal={true} href="/" icon={<House />}>
            Back home
          </IconLink>
        </p>
      </motion.main>
    </Layout>
  );
}
