import { useRef, useEffect, useState } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  useAnimationFrame,
  useReducedMotion,
  useScroll,
  useMotionTemplate,
} from "motion/react";

const RIBBONS = [
  {
    baseY: 60,
    waveAmp: 30,
    waveFreq: 0.4,
    speed: 0.15,
    phase: 0,
    baseOpacity: 0.5,
    color: "rgba(150, 170, 255, 0.6)",
    colorMid: "rgba(180, 140, 255, 0.3)",
  },
  {
    baseY: 45,
    waveAmp: 40,
    waveFreq: 0.3,
    speed: -0.12,
    phase: 1.8,
    baseOpacity: 0.4,
    color: "rgba(130, 210, 230, 0.5)",
    colorMid: "rgba(160, 180, 255, 0.25)",
  },
  {
    baseY: 70,
    waveAmp: 25,
    waveFreq: 0.5,
    speed: 0.18,
    phase: 3.6,
    baseOpacity: 0.35,
    color: "rgba(200, 150, 255, 0.45)",
    colorMid: "rgba(255, 170, 200, 0.2)",
  },
  {
    baseY: 50,
    waveAmp: 35,
    waveFreq: 0.35,
    speed: -0.1,
    phase: 5.2,
    baseOpacity: 0.3,
    color: "rgba(140, 230, 200, 0.4)",
    colorMid: "rgba(170, 200, 255, 0.2)",
  },
];

function Aurora({ speedMultiplier, opacityBoost, reducedMotion }) {
  const svgRef = useRef(null);
  const pathRefs = useRef([]);
  const phases = useRef(RIBBONS.map((r) => r.phase));
  const prevTime = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const opacity = useMotionValue(0.5);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 600px)").matches);
  }, []);

  useAnimationFrame((time) => {
    if (reducedMotion) return;

    const t = time / 1000;
    if (prevTime.current === null) prevTime.current = t;
    const dt = t - prevTime.current;
    prevTime.current = t;

    const speed = speedMultiplier.get();
    const timeScale = 1 + speed * 12;
    const ampScale = 1 + speed * 3;
    for (let i = 0; i < RIBBONS.length; i++) {
      // On mobile, skip every other ribbon
      if (isMobile && i % 2 !== 0) continue;

      const r = RIBBONS[i];
      const el = pathRefs.current[i];
      if (!el) continue;

      phases.current[i] += dt * r.speed * timeScale;
      const p = phases.current[i];
      const amp = r.waveAmp * ampScale;
      const oY = 100 + r.baseY;

      const y0 = oY + Math.sin(p) * amp;
      const y1 = oY + Math.sin(p + r.waveFreq * 250) * amp;
      const y2 = oY + Math.sin(p + r.waveFreq * 500) * amp;
      const y3 = oY + Math.sin(p + r.waveFreq * 750) * amp;
      const y4 = oY + Math.sin(p + r.waveFreq * 1000) * amp;

      el.setAttribute(
        "d",
        `M0,${y0} C250,${y1} 500,${y2} 750,${y3} L1000,${y4} L1000,200 L0,200 Z`
      );
    }

    const boost = opacityBoost.get();
    opacity.set(0.5 + boost);
  });

  return (
    <motion.svg
      ref={svgRef}
      className="footer__aurora-svg"
      viewBox="0 0 1000 200"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <defs>
        <filter id="aurora-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={isMobile ? 3 : 6} />
        </filter>
        {RIBBONS.map((r, i) => (
          <linearGradient
            key={i}
            id={`rg-${i}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={r.color} />
            <stop offset="50%" stopColor={r.colorMid} />
            <stop offset="100%" stopColor={r.color} />
          </linearGradient>
        ))}
      </defs>
      <g filter="url(#aurora-blur)">
        {RIBBONS.map((r, i) => (
          <path
            key={i}
            ref={(el) => (pathRefs.current[i] = el)}
            fill={`url(#rg-${i})`}
            d={`M0,${100 + r.baseY} L1000,${100 + r.baseY} L1000,200 L0,200 Z`}
          />
        ))}
      </g>
    </motion.svg>
  );
}

export function Footer() {
  const footerRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const lastTouchY = useRef(null);

  const inputIntensity = useMotionValue(0);

  const smoothSpeed = useSpring(inputIntensity, {
    stiffness: 40,
    damping: 15,
  });

  const smoothOpacity = useSpring(
    useTransform(inputIntensity, [0, 1], [0, 0.6]),
    { stiffness: 30, damping: 20 }
  );

  const { scrollYProgress } = useScroll();
  const heightValue = useTransform(scrollYProgress, [0.5, 1], [25, 100]);
  const smoothHeight = useSpring(heightValue, { stiffness: 60, damping: 20 });
  const height = useMotionTemplate`${smoothHeight}dvh`;

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollTimeout;

    const onWheel = (e) => {
      const speed = Math.min(Math.abs(e.deltaY) / 60, 1);
      inputIntensity.set(speed);
    };

    const onTouchStart = (e) => {
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (lastTouchY.current !== null) {
        const dy = Math.abs(e.touches[0].clientY - lastTouchY.current);
        const speed = Math.min(dy / 10, 1);
        inputIntensity.set(speed);
      }
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      lastTouchY.current = null;
      // If page won't momentum-scroll (e.g. already at bottom),
      // onScroll won't fire, so schedule a fallback decay
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => inputIntensity.set(0), 150);
    };

    // Catches momentum scrolling after finger lifts
    const onScroll = () => {
      const now = performance.now();
      const dt = now - lastScrollTime;
      lastScrollTime = now;
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;

      // Velocity = px per 16ms frame, normalized
      const velocity = dt > 0 ? (dy / dt) * 16 : 0;
      const speed = Math.min(velocity / 15, 1);
      inputIntensity.set(speed);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => inputIntensity.set(0), 150);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [inputIntensity]);

  return (
    <motion.footer className="footer" ref={footerRef} style={{ height }}>
      <Aurora
        speedMultiplier={smoothSpeed}
        opacityBoost={smoothOpacity}
        reducedMotion={reducedMotion}
      />
    </motion.footer>
  );
}
