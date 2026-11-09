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

function Projects({ projects }) {
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
        <div
          key={project.id}
          ref={(el) => (itemRefs.current[i] = el)}
          className="project enter"
          style={{ "--i": 5 + i }}
          onMouseEnter={() => setHovered(i)}
        >
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            <h4>
              <span className="project__icon">
                <ArrowIcon />
              </span>
              {project.title}
            </h4>
            <p>{project.description}</p>
          </a>
        </div>
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
        <p className="enter" style={{ "--i": 1 }}>
          I work across interfaces and brand to create holistic systems and
          experiences that intuitively become an extension of oneself. I believe
          in ideas over opinions and exploring one hundred ideas to find the
          right one.
        </p>
        <p className="enter" style={{ "--i": 2 }}>
          I am driven by curiosity and strive for a high level of craftsmanship
          in my work.
        </p>
        <p className="enter" style={{ "--i": 3 }}>
          Currently at{" "}
          <a
            href="https://shopify.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shopify
          </a>
          <br />
          Co-Founder of{" "}
          <a
            href="https://brunch.work"
            target="_blank"
            rel="noopener noreferrer"
          >
            Brunch
          </a>
        </p>

        <Slider projects={data.home.projects} />

        <Projects projects={data.home.packages} />

        <ThoughtsSlider thoughts={data.thoughts} />

        <div className="clients enter" style={{ "--i": 8 }}>
          <h3>Selected Clients</h3>
          <p>
            Apple, Shopify, WØRKS Studio, Evenko, RTINGS.com, REF Digital, ARC
            Health, LG2, Webisoft
          </p>
        </div>

        <div className="connect enter" style={{ "--i": 9 }}>
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
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
