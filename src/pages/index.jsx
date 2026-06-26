import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import Layout from "@/layouts/Layout";
import { IconLink } from "@/components/IconLink";
import { ArrowIcon } from "@/components/ArrowIcon";
import { fetchDato } from "@/utils/datocms";
import { getHome } from "@/gql/queries";
import { Slider } from "@/components/Slider";
import { ThoughtsSlider } from "@/components/ThoughtsSlider";
import { Footer } from "@/components/Footer";

const fadeIn = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

const projects = [
  {
    title: "Metamorphosis",
    description: "A dependency-free text and icon morphing animation library",
    href: "https://metamorphosis.oliviercarignan.com",
  },
  {
    title: "Vitrine",
    description: "Native scroll gallery with drag capability and lightbox",
    href: "https://vitrine.oliviercarignan.com",
  },
];

function Projects() {
  const [hovered, setHovered] = useState(null);
  const itemRefs = useRef([]);
  const containerRef = useRef(null);
  const enterEdge = useRef("top");

  // Record which edge the cursor crossed so the highlight can slide in from
  // the direction the cursor entered, rather than always from the top.
  const handleAreaEnter = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    enterEdge.current =
      e.clientY - rect.top <= rect.bottom - e.clientY ? "top" : "bottom";
  };

  const target = hovered != null ? itemRefs.current[hovered] : null;

  return (
    <div
      className="projects"
      ref={containerRef}
      onMouseEnter={handleAreaEnter}
      onMouseLeave={() => setHovered(null)}
    >
      <AnimatePresence>
        {target && (
          <motion.div
            className="project-hover"
            aria-hidden="true"
            initial={{
              opacity: 0,
              height: 0,
              top:
                enterEdge.current === "bottom"
                  ? (containerRef.current?.offsetHeight ?? 0)
                  : 0,
            }}
            animate={{
              opacity: 1,
              top: target.offsetTop,
              height: target.offsetHeight,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
      </AnimatePresence>
      {projects.map((project, i) => (
        <motion.div
          key={project.title}
          ref={(el) => (itemRefs.current[i] = el)}
          variants={fadeIn}
          className="project"
          onMouseEnter={() => setHovered(i)}
        >
          <a href={project.href} target="_blank" rel="noopener noreferrer">
            <h4>
              <span className="project__icon">
                <ArrowIcon />
              </span>
              {project.title}
            </h4>
            <p>{project.description}</p>
          </a>
        </motion.div>
      ))}
    </div>
  );
}

export async function getStaticProps() {
  const data = await fetchDato(getHome);
  return { props: { data } };
}

export default function Home({ data }) {
  return (
    <Layout>
      <main className="home">
        <motion.p variants={fadeIn}>
          I work across interfaces and brand to create holistic systems and
          experiences that intuitively become an extension of oneself. I believe
          in ideas over opinions and exploring one hundred ideas to find the
          right one.
        </motion.p>
        <motion.p variants={fadeIn}>
          I am driven by curiosity and strive for a high level of craftsmanship
          in my work.
        </motion.p>
        <motion.p variants={fadeIn}>
          Co-Founder &amp; Product Lead at{" "}
          <a
            href="https://brunch.work"
            target="_blank"
            rel="noopener noreferrer"
          >
            Brunch
          </a>
        </motion.p>

        <Slider projects={data.home.projects} />

        <Projects />

        <ThoughtsSlider thoughts={data.thoughts} />

        <motion.div className="clients" variants={fadeIn}>
          <h3>Selected Clients</h3>
          <p>
            Apple, WØRKS Studio, Evenko, RTINGS.com, REF Digital, ARC Health,
            LG2, Rounder
          </p>
        </motion.div>

        <motion.div className="connect" variants={fadeIn}>
          <h3>Connect</h3>
          <ul>
            <li>
              <IconLink
                isExternal={false}
                href={"hi@oliviercarignan.com"}
                children={"Email"}
              />
            </li>
            <li>
              <IconLink
                isExternal={true}
                href="https://github.com/olicarignan"
                target="_blank"
                rel="noopener noreferrer"
                children={"Github"}
              />
            </li>
            <li>
              <IconLink
                isExternal={true}
                href="https://www.are.na/olivier-carignan/"
                target="_blank"
                rel="noopener noreferrer"
                children={"Are.na"}
              />
            </li>
            <li>
              <IconLink
                isExternal={true}
                href="https://www.linkedin.com/in/olivier-carignan/"
                target="_blank"
                rel="noopener noreferrer"
                children={"LinkedIn"}
              />
            </li>
          </ul>
        </motion.div>
      </main>
      <Footer />
    </Layout>
  );
}
