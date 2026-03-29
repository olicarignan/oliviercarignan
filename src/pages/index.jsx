"use client";

import Layout from "@/layouts/Layout";

export default function Home() {
  return (
    <Layout>
      <main className="home">
        <header className="header">
          <h1>Olivier Carignan</h1>
          <h2>Designer, Engineer &amp; Founder</h2>
        </header>
        <article>
          <p>
            I focus on the intersection of form and function to create experiences that intuitively become an extension of oneself. I believe in ideas over opinions, prototypes as the most valuable tool for collaboration, and exploring one hundred ideas to find the right one.
          </p>
          <p>I am driven by curiosity and strive for a high level of craftsmanship and excellence in my work.</p>
          <p>Co-Founder &amp; Product Lead at <a href="https://brunch.work" target="_blank" rel="noopener noreferrer">Brunch</a></p>
        </article>

        <div className="clients">
          <h3>Selected Clients</h3>
          <ul>
            <li>Apple</li>
            <li>WØRKS</li>
            <li>Evenko</li>
            <li>RTINGS.com</li>
            <li>ARC Health</li>
            <li>LG2</li>
            <li>POP Montréal</li>
            <li>Rounder</li>
          </ul>
        </div>
        <div className="connect">
          <h3>Connect</h3>
          <ul>
            <li><a href="#">Email</a></li>
            <li><a href="#">Github</a></li>
            <li><a href="#">Are.na</a></li>
            <li><a href="#">LinkedIn</a></li>
          </ul>
        </div>
      </main>
    </Layout>
  );
}
