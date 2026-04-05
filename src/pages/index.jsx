import { motion } from "motion/react";
import Layout from "@/layouts/Layout";
import { IconLink } from "@/components/IconLink";
import { fetchDato } from "@/utils/datocms";
import { getHome } from "@/gql/queries";
import { Slider } from "@/components/Slider";
import { ThoughtsSlider } from "@/components/ThoughtsSlider";

const fadeIn = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0, 0.55, 0.45, 1] },
  },
};

export async function getStaticProps() {
  const data = await fetchDato(getHome);
  return { props: { data } };
}

export default function Home({ data }) {
  console.log(data);

  return (
    <Layout>
      <main className="home">
        <motion.p variants={fadeIn}>
          I focus on the intersection of form and function to create experiences
          that intuitively become an extension of oneself. I believe in ideas
          over opinions, prototypes as the most valuable tool for collaboration,
          and exploring one hundred ideas to find the right one.
        </motion.p>
        <motion.p variants={fadeIn}>
          I am driven by curiosity and strive for a high level of craftsmanship
          and excellence in my work.
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

        <motion.div className="clients" variants={fadeIn}>
          <h3>Selected Clients</h3>
          <p>
            Apple, WØRKS, Evenko, RTINGS.com, ARC Health, LG2, POP Montréal,
            Rounder
          </p>
        </motion.div>
        {data.home.thougths && <ThoughtsSlider />}

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
                children={"Github"}
              />
            </li>
            <li>
              <IconLink
                isExternal={true}
                href="https://www.are.na/olivier-carignan/"
                children={"Are.na"}
              />
            </li>
            <li>
              <IconLink
                isExternal={true}
                href="https://www.linkedin.com/in/olivier-carignan/"
                children={"LinkedIn"}
              />
            </li>
          </ul>
        </motion.div>
      </main>
    </Layout>
  );
}
