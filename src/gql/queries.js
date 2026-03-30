export const getHome = `
  query GetHome {
  home {
      projects {
        title
        id
        typeYear
        featuredImage {
          responsiveImage(imgixParams: { auto: format, q: 75 }) {
            srcSet
            webpSrcSet
            sizes
            src
            width
            height
            alt
            base64
          }
        }
      }
    }
  }
`;
