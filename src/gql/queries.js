export const getHome = `
  query GetHome {
  home {
      projects {
        title
        id
        typeYear
        featuredImage {
          responsiveImage(imgixParams: { auto: format, q: 75, w: 680, h: 453, fit: crop }) {
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
        video {
          url
        }
      }
    }
    thoughts: allThoughts {
      id
      slug
      title
      date
      content {
      blocks
      inlineBlocks
      links
      value
      }
      featuredImage {
      responsiveImage {
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
`;
