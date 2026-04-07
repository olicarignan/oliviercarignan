import { useRef, useEffect } from "react";
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

const RIBBON_CONFIGS = [
  {
    baseY: 60,
    waveAmp: 30,
    waveFreq: 0.4,
    speed: 0.15,
    phase: 0,
    height: 120,
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
    height: 140,
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
    height: 100,
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
    height: 130,
    baseOpacity: 0.3,
    color: "rgba(140, 230, 200, 0.4)",
    colorMid: "rgba(170, 200, 255, 0.2)",
  },
];

function Ribbon({ config, speedMultiplier, opacityBoost, reducedMotion }) {
  const pathRef = useRef(null);
  const phase = useRef(config.phase);
  const prevTime = useRef(null);

  const opacity = useMotionValue(config.baseOpacity);

  useAnimationFrame((time) => {
    if (reducedMotion) return;

    const t = time / 1000;
    if (prevTime.current === null) prevTime.current = t;
    const dt = t - prevTime.current;
    prevTime.current = t;

    const speed = speedMultiplier.get();
    const timeScale = 1 + speed * 12;
    phase.current += dt * config.speed * timeScale;

    const ampScale = 1 + speed * 3;
    const p = phase.current;
    const freq = config.waveFreq;
    const amp = config.waveAmp * ampScale;

    // Generate smooth wave path across the width
    const oY = 100 + config.baseY;
    const y0 = oY + Math.sin(p) * amp;
    const y1 = oY + Math.sin(p + freq * 250) * amp;
    const y2 = oY + Math.sin(p + freq * 500) * amp;
    const y3 = oY + Math.sin(p + freq * 750) * amp;
    const y4 = oY + Math.sin(p + freq * 1000) * amp;

    const d = `M0,${y0} C250,${y1} 500,${y2} 750,${y3} L1000,${y4} L1000,200 L0,200 Z`;

    if (pathRef.current) {
      pathRef.current.setAttribute("d", d);
    }

    const boost = opacityBoost.get();
    opacity.set(Math.min(config.baseOpacity + boost, 1));
  });

  return (
    <motion.svg
      className="footer__ribbon"
      viewBox="0 0 1000 200"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <defs>
        <filter id={`ribbon-blur-${config.phase}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient
          id={`ribbon-grad-${config.phase}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={config.color} />
          <stop offset="50%" stopColor={config.colorMid} />
          <stop offset="100%" stopColor={config.color} />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        filter={`url(#ribbon-blur-${config.phase})`}
        fill={`url(#ribbon-grad-${config.phase})`}
        d={`M0,${100 + config.baseY} C250,${100 + config.baseY} 500,${100 + config.baseY} 750,${100 + config.baseY} L1000,${100 + config.baseY} L1000,200 L0,200 Z`}
      />
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
    let scrollTimeout;

    const onWheel = (e) => {
      const speed = Math.min(Math.abs(e.deltaY) / 60, 1);
      inputIntensity.set(speed);
    };

    const onTouchMove = (e) => {
      if (lastTouchY.current !== null) {
        const dy = Math.abs(e.touches[0].clientY - lastTouchY.current);
        const speed = Math.min(dy / 15, 1);
        inputIntensity.set(speed);
      }
      lastTouchY.current = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      lastTouchY.current = null;
    };

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      const speed = Math.min(dy / 40, 1);
      inputIntensity.set(speed);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => inputIntensity.set(0), 150);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [inputIntensity]);

  return (
    <motion.footer className="footer" ref={footerRef} style={{ height }}>
      <div className="footer__aurora">
        {RIBBON_CONFIGS.map((config, i) => (
          <Ribbon
            key={i}
            config={config}
            speedMultiplier={smoothSpeed}
            opacityBoost={smoothOpacity}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </motion.footer>
  );
}
