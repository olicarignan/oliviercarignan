export const getHome = `
  query GetHome {
  home {
      packages {
        id
        title
        description
        url
      }
      projects {
        title
        id
        typeYear
        featuredImage {
          responsiveImage(imgixParams: { auto: [format, compress], q: 80, w: 1680, h: 1120, fit: crop }) {
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
      responsiveImage(imgixParams: { auto: [format, compress], q: 75, w: 900, h: 1125, fit: crop }) {
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
