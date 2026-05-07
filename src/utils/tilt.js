export function createTiltHandlers(deg = 4) {
  const pending = new Map();
  let rafId = 0;

  const flush = () => {
    rafId = 0;
    for (const [el, { x, y }] of pending) {
      const rect = el.getBoundingClientRect();
      const xn = (x - rect.left) / rect.width;
      const yn = (y - rect.top) / rect.height;
      const rotateX = (yn - 0.5) * -deg;
      const rotateY = (xn - 0.5) * deg;
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
    pending.clear();
  };

  return {
    onMouseMove(e) {
      const el = e.currentTarget;
      el.style.transition = "transform 0.1s ease-out";
      pending.set(el, { x: e.clientX, y: e.clientY });
      if (!rafId) rafId = requestAnimationFrame(flush);
    },
    onMouseLeave(e) {
      const el = e.currentTarget;
      pending.delete(el);
      el.style.transform = "";
      el.style.transition = "transform 0.3s ease-out";
    },
  };
}

const defaultTilt = createTiltHandlers(4);
export const handleTiltMove = defaultTilt.onMouseMove;
export const handleTiltLeave = defaultTilt.onMouseLeave;
