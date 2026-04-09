export function createTiltHandlers(deg = 4) {
  return {
    onMouseMove(e) {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (y - 0.5) * -deg;
      const rotateY = (x - 0.5) * deg;
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      el.style.transition = "transform 0.1s ease-out";
    },
    onMouseLeave(e) {
      const el = e.currentTarget;
      el.style.transform = "";
      el.style.transition = "transform 0.3s ease-out";
    },
  };
}

const defaultTilt = createTiltHandlers(4);
export const handleTiltMove = defaultTilt.onMouseMove;
export const handleTiltLeave = defaultTilt.onMouseLeave;
