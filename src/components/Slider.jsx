export function Slider({ projects }) {
  return (
    <div className="slider">
      {projects.map((project) => (
        <div key={project.id} className="slider-item">
          <img src={project.featuredImage.url} alt={project.title} />
          <h3>{project.title}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}
