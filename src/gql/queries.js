export const getHome = `
  query GetHome {
  home {
      projects {
        title
        id
        typeYear
        featuredImage {
          responsiveImage(imgixParams: { auto: [format, compress], q: 75, w: 680, h: 453, fit: crop }) {
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
        lightboxImage: featuredImage {
          responsiveImage(imgixParams: { auto: [format, compress], q: 80, w: 1600, h: 1067, fit: crop }) {
            srcSet
            webpSrcSet
            sizes
            src
            width
            height
            alt
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
      responsiveImage(imgixParams: { auto: [format, compress], q: 75, w: 600, h: 750, fit: crop }) {
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
