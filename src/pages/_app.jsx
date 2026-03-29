import "@/styles/globals.css";

export default function App({ Component, pageProps, router }) {
  return (
    <div className="grid">
      <Component key={router.route} {...pageProps} />
    </div>
  );
}
