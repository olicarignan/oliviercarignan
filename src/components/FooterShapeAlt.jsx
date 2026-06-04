import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_URL = "/models/tennis-ball.glb";

// The copyright (©) glyph, same source path used by the original FooterShape.
const SVG_PATH =
  "M2.68189 6C2.68189 5.37879 2.8334 4.8125 3.13643 4.30114C3.43946 3.78977 3.84666 3.38258 4.35802 3.07955C4.86939 2.77652 5.43567 2.625 6.05689 2.625C6.59477 2.625 7.09098 2.74053 7.54552 2.97159C8.00386 3.20265 8.38264 3.51894 8.68189 3.92045C8.98113 4.31818 9.16674 4.76894 9.23871 5.27273H7.8637C7.78795 4.88258 7.57772 4.56439 7.23302 4.31818C6.88833 4.06818 6.49628 3.94318 6.05689 3.94318C5.6781 3.94318 5.3334 4.03598 5.0228 4.22159C4.71219 4.4072 4.46408 4.6553 4.27848 4.96591C4.09287 5.27652 4.00007 5.62121 4.00007 6C4.00007 6.37879 4.09287 6.72348 4.27848 7.03409C4.46408 7.3447 4.71219 7.5928 5.0228 7.77841C5.3334 7.96402 5.6781 8.05682 6.05689 8.05682C6.49628 8.05682 6.86749 7.93371 7.17052 7.6875C7.47734 7.4375 7.67052 7.11742 7.75007 6.72727H9.12507C9.0531 7.23106 8.87696 7.68371 8.59666 8.08523C8.31636 8.48295 7.95651 8.79735 7.51711 9.02841C7.08151 9.25947 6.59477 9.375 6.05689 9.375C5.43567 9.375 4.86939 9.22349 4.35802 8.92045C3.84666 8.61742 3.43946 8.21023 3.13643 7.69886C2.8334 7.1875 2.68189 6.62121 2.68189 6ZM6.00007 12C5.17431 12 4.3978 11.8447 3.67052 11.5341C2.94704 11.2235 2.30878 10.7936 1.75575 10.2443C1.20651 9.69129 0.77469 9.05303 0.460296 8.32955C0.14969 7.60606 -0.00371946 6.82955 6.84569e-05 6C0.00385629 5.17045 0.161053 4.39394 0.471659 3.67045C0.786053 2.94697 1.21787 2.31061 1.76711 1.76136C2.31636 1.20833 2.95272 0.776515 3.67621 0.465909C4.39969 0.155303 5.17431 0 6.00007 0C6.82961 0 7.60613 0.155303 8.32961 0.465909C9.05689 0.776515 9.69325 1.20833 10.2387 1.76136C10.7879 2.31061 11.2179 2.94697 11.5285 3.67045C11.8391 4.39394 11.9963 5.17045 12.0001 6C12.0039 6.82955 11.8504 7.60606 11.5398 8.32955C11.2292 9.05303 10.7993 9.69129 10.2501 10.2443C9.70083 10.7936 9.06257 11.2235 8.3353 11.5341C7.60802 11.8447 6.82961 12 6.00007 12ZM6.00007 10.6818C6.6478 10.6818 7.25575 10.5606 7.82393 10.3182C8.39211 10.0758 8.89022 9.74053 9.31825 9.3125C9.74628 8.88447 10.0815 8.38826 10.3239 7.82386C10.5664 7.25568 10.6857 6.64962 10.6819 6.00568C10.6781 5.35795 10.555 4.75 10.3126 4.18182C10.0701 3.61364 9.73492 3.11553 9.30689 2.6875C8.87886 2.25947 8.38264 1.92424 7.81825 1.68182C7.25386 1.43939 6.6478 1.31818 6.00007 1.31818C5.35613 1.31818 4.75196 1.43939 4.18757 1.68182C3.62317 1.92424 3.12696 2.26136 2.69893 2.69318C2.2709 3.12121 1.93378 3.61932 1.68757 4.1875C1.44514 4.75189 1.32204 5.35795 1.31825 6.00568C1.31446 6.64583 1.43378 7.25 1.6762 7.81818C1.91863 8.38258 2.25386 8.87879 2.68189 9.30682C3.11371 9.73485 3.61181 10.072 4.17621 10.3182C4.74439 10.5606 5.35234 10.6818 6.00007 10.6818Z";

const BALL_RADIUS = 4; // normalized on-screen radius regardless of model scale

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

// Rasterize the © glyph (12x12 viewBox) to a transparent texture for the decal.
function useCopyrightTexture() {
  return useMemo(() => {
    const SIZE = 1024;
    const PAD = 0.16; // fraction of canvas left as transparent margin
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");

    const draw = SIZE * (1 - PAD * 2);
    const scale = draw / 12;
    ctx.translate(SIZE * PAD, SIZE * PAD);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#1a1a1a";
    // nonzero winding matches the original SVG rendering (ring + C with holes)
    ctx.fill(new Path2D(SVG_PATH));

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function Ball({ speedMultiplier, inputIntensity }) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const prevClientX = useRef(0);
  const momentum = useRef(0);
  const tiltIntensity = useRef(0);
  const { gl } = useThree();

  const gltf = useLoader(GLTFLoader, MODEL_URL, (loader) => {
    // The model is meshopt-compressed (EXT_meshopt_compression) to keep it light.
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const decalTexture = useCopyrightTexture();

  // Normalize the model, carve the © groove into the felt (shaving the fuzz that
  // sits over the symbol), then project the decal into that groove so it reads as
  // etched rather than buried under strands.
  const { scene: ballScene, decalGeometry } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    // Resolve world matrices first; the model carries root transforms (Sketchfab
    // Z-up fix) that must be applied before measuring or projecting.
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    // Sphere radius ≈ half its width (averaged across axes for robustness).
    const radius = (size.x + size.y + size.z) / 6;
    const s = BALL_RADIUS / radius;

    // Bake the centering + scale into the model so the rendered ball and the
    // (world-space) decal geometry share one coordinate frame.
    cloned.scale.multiplyScalar(s);
    cloned.position.sub(center.multiplyScalar(s));
    cloned.updateMatrixWorld(true);

    // Use the largest mesh as the projection target — that's the felt body.
    let target = null;
    let maxVerts = -1;
    cloned.traverse((obj) => {
      if (obj.isMesh) {
        const count = obj.geometry?.attributes?.position?.count ?? 0;
        if (count > maxVerts) {
          maxVerts = count;
          target = obj;
        }
      }
    });

    // Decal projector: a box on the +Z front of the ball looking inward.
    const DECAL_W = BALL_RADIUS * 1.05;
    const position = new THREE.Vector3(0, 0, BALL_RADIUS);
    const orientation = new THREE.Euler(0, 0, 0);
    const decalSize = new THREE.Vector3(DECAL_W, DECAL_W, BALL_RADIUS * 2.2);

    // Measure the fuzz-tip radius on the front hemisphere so the symbol can sit
    // just above the strands.
    const pos = target.geometry.attributes.position;
    const v = new THREE.Vector3();
    let maxR = 0;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(target.matrixWorld);
      if (v.z <= 0) continue; // front hemisphere only
      const r = v.length();
      if (r > maxR) maxR = r;
    }
    const DECAL_R = maxR + BALL_RADIUS * 0.012; // just proud of the tallest strand

    // Project onto a SMOOTH sphere at DECAL_R (not the fuzzy mesh — projecting
    // onto hair geometry shatters the decal into per-strand specks). Sitting just
    // above the fuzz, the opaque strokes are depth-tested normally: they occlude
    // the strands beneath on the front face, and stay hidden on the far side.
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(DECAL_R, 160, 160));
    sphere.updateMatrixWorld();
    const decal = new DecalGeometry(
      sphere,
      new THREE.Vector3(0, 0, DECAL_R),
      orientation,
      decalSize
    );
    sphere.geometry.dispose();

    return { scene: cloned, decalGeometry: decal };
  }, [gltf]);

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

  const hitGeometry = useMemo(
    () => new THREE.SphereGeometry(BALL_RADIUS * 1.25, 32, 32),
    []
  );

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
      <primitive object={ballScene} />

      {/* © etched into the ball: an alpha-cut decal whose opaque pixels write
          depth and are pulled forward past the fuzz strands, so the felt fuzz is
          cleared off the symbol. depthTest stays on so it can't show through the
          ball when it rotates to the far side. */}
      <mesh geometry={decalGeometry} renderOrder={1}>
        <meshBasicMaterial map={decalTexture} alphaTest={0.5} />
      </mesh>

      {/* invisible grab target */}
      <mesh
        geometry={hitGeometry}
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

export function FooterShapeAlt({ speedMultiplier, inputIntensity }) {
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
      <Suspense fallback={null}>
        <Ball speedMultiplier={speedMultiplier} inputIntensity={inputIntensity} />
      </Suspense>
    </Canvas>
  );
}
