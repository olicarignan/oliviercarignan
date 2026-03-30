import "@/styles/globals.css";
import Head from "@/components/Head";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps, router }) {
  return (
    <>
      <Head />
      <div className="grid">
        <Component key={router.route} {...pageProps} />
      </div>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
