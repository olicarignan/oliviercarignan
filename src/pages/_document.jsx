import { Html, Head, Main, NextScript } from "next/document";

// Holds the CSS entrance until the fonts arrive, for 2s at most on a slow
// connection. It sits in <body> so the stylesheet that declares them has loaded.
const holdEntranceForFonts = `(function () {
  if (!document.fonts || !document.fonts.load) return;
  var root = document.documentElement;
  var release = function () { root.classList.remove("enter-hold"); };
  root.classList.add("enter-hold");
  Promise.race([
    Promise.all([document.fonts.load("400 1em s"), document.fonts.load("450 1em s")]),
    new Promise(function (resolve) { setTimeout(resolve, 2000); }),
  ]).then(release, release);
})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="preload"
          href="/fonts/SuisseIntl/Suisse%20Intl%20Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SuisseIntl/SuisseIntl%20Book.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: holdEntranceForFonts }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
