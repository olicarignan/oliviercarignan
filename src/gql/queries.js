export const getHome = `
  query GetHome {
  home {
      projects {
        title
        id
        typeYear
        featuredImage {
          alt
          url
          height
          width
        }
      }
    }
  }
`;
