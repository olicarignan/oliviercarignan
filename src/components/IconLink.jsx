export const IconLink = ({ href, icon, children }) => {
  console.log(icon)


  return (
    <a
      href={href}
      className="icon-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="icon-link__icon">{icon}</span>
      <span className="icon-link__text">{children}</span>
    </a>
  );
};
