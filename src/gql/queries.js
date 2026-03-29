export const getHome = `
  query GetHome {
  home2 {
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
