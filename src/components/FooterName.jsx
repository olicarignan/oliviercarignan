import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { interpolate as flubberInterpolate } from "flubber";
import {
  O_OUTER,
  O_INNER,
  C_SHAPE,
  COPYRIGHT_RING_OUT,
  COPYRIGHT_RING_IN,
  COPYRIGHT_INNER_C,
  GLYPH_VIEWBOX,
} from "./footerGlyphs";

const NAME = "Olivier Carignan";
const O_INDEX = 0;
const C_INDEX = NAME.indexOf("C");

// Pinned-progress point that commits to the shape. Crossing it (scrolling
// down) fires the morph once and latches — there is no path back to the name.
const TRIGGER = 0.22;
const MORPH_MS = 950;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// Convergence runs over the middle of the morph timeline.
const convergeAmt = (m) => easeInOutCubic(clamp01((m - 0.1) / 0.6));

export function FooterName({ footerRef, inputIntensity, burstRef }) {
  const containerRef = useRef(null);
  const oRef = useRef(null);
  const cRef = useRef(null);
  const ringPathRef = useRef(null);
  const innerCPathRef = useRef(null);

  const phaseRef = useRef("name"); // "name" | "shape" (latched, one-way)
  const morphDoneRef = useRef(false);
  const burstFiredRef = useRef(false);
  const lastVelRef = useRef(0);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Timed morph driver (0 → 1), animated on trigger — not scroll-scrubbed.
  const morph = useMotionValue(0);
  const oTarget = useMotionValue(0);
  const cTarget = useMotionValue(0);

  const oX = useTransform(() => oTarget.get() * convergeAmt(morph.get()));
  const cX = useTransform(() => cTarget.get() * convergeAmt(morph.get()));
  const othersOpacity = useTransform(morph, [0.0, 0.3], [1, 0], { clamp: true });
  const overlayOpacity = useTransform(morph, [0.75, 1], [1, 0], { clamp: true });

  const ringOuterInterp = useMemo(
    () => flubberInterpolate(O_OUTER, COPYRIGHT_RING_OUT, { maxSegmentLength: 0.5 }),
    []
  );
  const ringInnerInterp = useMemo(
    () => flubberInterpolate(O_INNER, COPYRIGHT_RING_IN, { maxSegmentLength: 0.5 }),
    []
  );
  const innerCInterp = useMemo(
    () => flubberInterpolate(C_SHAPE, COPYRIGHT_INNER_C, { maxSegmentLength: 0.5 }),
    []
  );

  const drawPaths = useCallback(
    (t) => {
      ringPathRef.current?.setAttribute(
        "d",
        ringOuterInterp(t) + " " + ringInnerInterp(t)
      );
      innerCPathRef.current?.setAttribute("d", innerCInterp(t));
    },
    [ringOuterInterp, ringInnerInterp, innerCInterp]
  );

  useMotionValueEvent(morph, "change", (m) => {
    // Shape morph runs slightly behind the convergence so the letters travel
    // in as glyphs, then deform into the © near the end.
    drawPaths(clamp01((m - 0.2) / 0.65));
    // Momentum burst the moment the letters have become the icon.
    if (m >= 0.8 && !burstFiredRef.current) {
      burstFiredRef.current = true;
      burstRef?.current?.(0.16);
    }
  });

  // Seed the source glyph paths on mount.
  useEffect(() => {
    drawPaths(0);
  }, [drawPaths]);

  // Measure how far the O and C must travel to converge at the centre.
  useLayoutEffect(() => {
    const measure = () => {
      if (phaseRef.current !== "name") return;
      const c = containerRef.current;
      const o = oRef.current;
      const cc = cRef.current;
      if (!c || !o || !cc) return;
      const cr = c.getBoundingClientRect();
      const or = o.getBoundingClientRect();
      const ccr = cc.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      oTarget.set(cx - (or.left + or.width / 2));
      cTarget.set(cx - (ccr.left + ccr.width / 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [oTarget, cTarget]);

  const tweenMorphTo1 = useCallback(() => {
    const from = morph.get();
    const startT = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startT) / MORPH_MS);
      morph.set(from + (1 - from) * easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
      else morphDoneRef.current = true;
    };
    requestAnimationFrame(step);
  }, [morph]);

  const triggerMorph = useCallback(() => {
    if (phaseRef.current !== "name") return;
    phaseRef.current = "shape";
    if (reducedMotion) {
      // Instant switch, no spin — keep motion to a minimum. Latch the burst
      // guard before setting morph so the change handler doesn't kick a spin.
      morphDoneRef.current = true;
      burstFiredRef.current = true;
      morph.set(1);
      return;
    }
    tweenMorphTo1();
  }, [reducedMotion, morph, tweenMorphTo1]);

  // Scroll handling: detect the trigger while showing the name, then (in the
  // shape phase) drive spin from scroll velocity with a burst on release.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let releaseTimer;

    const pinnedProgress = () => {
      const rect = footer.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      if (range <= 0) return 0;
      return clamp01(-rect.top / range);
    };

    const onScroll = () => {
      const now = performance.now();
      const dt = now - lastT;
      lastT = now;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      const vel = dt > 0 ? (Math.abs(dy) / dt) * 16 : 0;
      lastVelRef.current = vel;

      if (phaseRef.current === "name") {
        if (dy > 0 && pinnedProgress() >= TRIGGER) triggerMorph();
        return;
      }

      // Shape phase — let the morph + its burst finish before scroll spin.
      // Reduced motion keeps only direct drag (handled in FooterShape).
      if (!morphDoneRef.current || reducedMotion) return;
      inputIntensity.set(Math.min(vel / 30, 1));
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        burstRef?.current?.(Math.min(lastVelRef.current / 40, 1) * 0.18 + 0.03);
        inputIntensity.set(0);
      }, 140);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(releaseTimer);
    };
  }, [footerRef, inputIntensity, burstRef, triggerMorph, reducedMotion]);

  const letters = useMemo(() => NAME.split(""), []);

  return (
    <motion.div
      className="footer__name"
      ref={containerRef}
      style={{ opacity: overlayOpacity }}
      aria-label={NAME}
    >
      {letters.map((char, i) => {
        if (i === O_INDEX) {
          return (
            <motion.span
              key={i}
              ref={oRef}
              className="footer__name-glyph"
              style={{ x: oX }}
              aria-hidden
            >
              <svg viewBox={GLYPH_VIEWBOX} className="footer__name-glyph-svg">
                <path
                  ref={ringPathRef}
                  d={O_OUTER + " " + O_INNER}
                  fillRule="evenodd"
                />
              </svg>
            </motion.span>
          );
        }
        if (i === C_INDEX) {
          return (
            <motion.span
              key={i}
              ref={cRef}
              className="footer__name-glyph"
              style={{ x: cX }}
              aria-hidden
            >
              <svg viewBox={GLYPH_VIEWBOX} className="footer__name-glyph-svg">
                <path ref={innerCPathRef} d={C_SHAPE} />
              </svg>
            </motion.span>
          );
        }
        if (char === " ") {
          return (
            <span key={i} className="footer__name-space" aria-hidden>
              &nbsp;
            </span>
          );
        }
        return <PlainLetter key={i} char={char} opacity={othersOpacity} />;
      })}
    </motion.div>
  );
}

function PlainLetter({ char, opacity }) {
  return (
    <motion.span className="footer__name-letter" style={{ opacity }} aria-hidden>
      {char}
    </motion.span>
  );
}
