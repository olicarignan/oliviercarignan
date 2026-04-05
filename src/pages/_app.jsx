import "@/styles/globals.css";
import SEO from "@/components/SEO";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollGradients } from "@/components/ScrollGradients";

export default function App({ Component, pageProps, router }) {
  return (
    <>
      <SEO />
      <div className="grid">
        <Component key={router.route} {...pageProps} />
      </div>
      <ScrollGradients />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
