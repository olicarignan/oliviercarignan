import { useRef } from "react";
import { useSpring, useMotionValue } from "motion/react";
import { FooterShape } from "./FooterShape";
import { FooterName } from "./FooterName";

export function Footer() {
  const footerRef = useRef(null);

  // Scroll-velocity → spin speed (only fed once we're in the shape phase).
  const inputIntensity = useMotionValue(0);
  const smoothSpeed = useSpring(inputIntensity, {
    stiffness: 25,
    damping: 20,
  });

  // Imperative momentum-burst handle, wired up by FooterShape.
  const burstRef = useRef(null);

  return (
    <footer className="footer" ref={footerRef}>
      <div className="footer__stage">
        <FooterShape
          speedMultiplier={smoothSpeed}
          inputIntensity={inputIntensity}
          burstRef={burstRef}
        />
        <FooterName
          footerRef={footerRef}
          inputIntensity={inputIntensity}
          burstRef={burstRef}
        />
      </div>
    </footer>
  );
}
