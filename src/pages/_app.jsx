import "@/styles/globals.css";
import { AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { usePreloader } from "@/hooks/usePreloader";
import Preloader from "@/components/Preloader";
import useSWR from "swr";
import { fetcher } from "@/utils/propData";
import { getHome } from "@/gql/queries.js";
import Seo from "@/components/Seo";
import Nav from "@/components/Nav";

export default function App({ Component, pageProps, router }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("00");
  const [total, setTotal] = useState("00");

  const { data } = useSWR(getHome, (query) => fetcher(query));

  const assets = data?.home?.assets;

  // Preload images when available
  useEffect(() => {
    if (!assets) return;

    setTotal(assets.length.toString().padStart(2, "0"));
    usePreloader(assets, setProgress).then(() => {
      setTimeout(() => {
        setLoading(false); // Hide immediately when done
      }, 500);
    });
  }, [assets]);

  return (
    <>
      <Seo />
      {!loading && <Nav />}
      <AnimatePresence mode="wait" initial="false">
        {loading ? (
          <Preloader progress={progress} total={total} />
        ) : (
          <Component key={router.route} {...pageProps} home={data.home} />
        )}
      </AnimatePresence>
    </>
  );
}
