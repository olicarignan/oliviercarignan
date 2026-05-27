import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { COPYRIGHT_FULL, GLYPH_VIEWBOX } from "./footerGlyphs";

function SceneSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment()).texture;
    scene.environment = env;
    pmrem.dispose();
    return () => {
      env.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);

  return null;
}

function Shape({ speedMultiplier, inputIntensity, burstRef }) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const prevClientX = useRef(0);
  const momentum = useRef(0);
  const tiltIntensity = useRef(0);
  const { gl } = useThree();

  // Expose an imperative momentum burst so the morph hand-off and scroll
  // release can give the shape a spin kick that then decays naturally.
  useEffect(() => {
    if (!burstRef) return;
    burstRef.current = (amount) => {
      momentum.current += amount;
      tiltIntensity.current = Math.min(0.3, tiltIntensity.current + amount * 0.6);
    };
    return () => {
      burstRef.current = null;
    };
  }, [burstRef]);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const dx = e.clientX - prevClientX.current;
      prevClientX.current = e.clientX;
      momentum.current = dx * 0.02;
      tiltIntensity.current = Math.min(0.3, Math.abs(dx) * 0.015);
      if (groupRef.current) groupRef.current.rotation.y += dx * 0.02;
    };

    const onPointerUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
    };

    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const dx = -e.deltaX * 0.02;
      momentum.current = dx;
      tiltIntensity.current = Math.min(0.3, Math.abs(e.deltaX) * 0.003);
      if (groupRef.current) groupRef.current.rotation.y += dx;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    gl.domElement.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      gl.domElement.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  const geometry = useMemo(() => {
    const loader = new SVGLoader();
    const data = loader.parse(
      `<svg viewBox="${GLYPH_VIEWBOX}" xmlns="http://www.w3.org/2000/svg"><path d="${COPYRIGHT_FULL}" fill="black"/></svg>`
    );

    const shapes = data.paths.flatMap((path) => SVGLoader.createShapes(path));

    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 2,
      bevelEnabled: true,
      bevelThickness: 0.9,
      bevelSize: 0.15,
      bevelSegments: 16,
    });

    geo.computeBoundingBox();
    const center = new THREE.Vector3();
    geo.boundingBox.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);

    return geo;
  }, []);

  const hitGeometry = useMemo(() => new THREE.SphereGeometry(6, 32, 32), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speed = speedMultiplier.get();

    if (!isDragging.current) {
      groupRef.current.rotation.y += delta * speed * 20;
      groupRef.current.rotation.y += momentum.current;
      momentum.current *= 0.97;
    }

    const targetTilt = isDragging.current
      ? tiltIntensity.current
      : Math.max(speed * 0.3, tiltIntensity.current);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetTilt,
      0.05
    );
    tiltIntensity.current *= 0.92;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} scale={[0.3, -0.3, 0.3]}>
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.275}
          iridescence={0.25}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[300, 600]}
        />
      </mesh>
      <mesh
        geometry={hitGeometry}
        scale={[0.3, 0.3, 0.3]}
        onPointerEnter={() => { document.body.style.cursor = "grab"; }}
        onPointerLeave={() => { if (!isDragging.current) document.body.style.cursor = ""; }}
        onPointerDown={(e) => {
          isDragging.current = true;
          prevClientX.current = e.clientX;
          momentum.current = 0;
          tiltIntensity.current = 0;
          inputIntensity.set(0);
          document.body.style.cursor = "grabbing";
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function FooterShape({ speedMultiplier, inputIntensity, burstRef }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 50 }}
      className="footer__canvas"
    >
      <SceneSetup />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-5, 3, -3]} intensity={0.8} color="#ffbbcc" />
      <directionalLight position={[3, -5, 2]} intensity={1.5} color="#44aaff" />
      <Shape
        speedMultiplier={speedMultiplier}
        inputIntensity={inputIntensity}
        burstRef={burstRef}
      />
    </Canvas>
  );
}
