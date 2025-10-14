import Head from "next/head";

export default function Seo() {
  return (
    <>
      <Head>
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=2"
        />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <meta
          name="keywords"
          content="Digital Design, Art Direction, Branding & Identity, Interaction Design, Research & Strategy, Product Design, Experimental Development"
        />
        <meta name="author" content="Olivier Carignan" />
        <meta name="referrer" content="no-referrer" />
        <meta name="geo.region" content="CA" />
        <meta name="geo.placename" content="Montreal" />

        {/* START FAVICON */}
        <link
          rel="icon"
          type="image/png"
          href="/images/favicon_light.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/png"
          href="/images/favicon_dark.png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" href="./favicon.ico" />
        <link
          rel="mask-icon"
          href="/images/apple_touch--light.png"
          color="#fcfbf8"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="mask-icon"
          href="/images/apple_touch--dark.png"
          color="#1b1917"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="msapplication-TileColor" content="#fcfbf8" />

        <title>Olivier Carignan</title>

        <meta
          name="description"
          content="Multidisciplinary Designer & Engineer"
        />

        {/* START OG META */}
        <meta property="og:title" content="Olivier Carignan" />
        <meta
          property="og:description"
          content="Multidisciplinary Designer & Engineer"
        />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:image" content="/images/og-image--light.png" />
        <meta property="og:image:width" content="630" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Olivier Carignan logo" />
        <meta property="og:site_name" content="Olivier Carignan" />
        <meta property="og:url" content="https://oliviercarignan.com" />
        <meta property="og:logo" content="/images/og-image--light.png" />

        {/* START TWITTER META */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@1101111_1100011" />
        <meta name="twitter:creator" content="@1101111_1100011" />
        <meta name="twitter:title" content="Olivier Carignan" />
        <meta
          name="twitter:description"
          content="Multidisciplinary Designer & Engineer"
        />
        <meta name="twitter:image" content="/images/og-image--light.png" />
        {/* END TWITTER META */}
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="a2ba20c1-3fc9-466c-959b-7bb37011f8ab"
        ></script>
      </Head>
    </>
  );
}
