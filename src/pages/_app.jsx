import "@/styles/globals.css";
import Head from "@/components/Head";

export default function App({ Component, pageProps, router }) {
  return (
    <>
      <Head />
      <div className="grid">
        <Component key={router.route} {...pageProps} />
      </div>
    </>
  );
}
