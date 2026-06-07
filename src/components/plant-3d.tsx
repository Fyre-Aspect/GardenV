'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The landing-page plant. The body is a loaded model (red_rose.glb) that we
 * auto-fit into the page's vertical layout; the roots below it stay procedural
 * three.js tubes so the scroll story still ends in the soil.
 *
 * NOTE: red_rose.glb is ~38 MB (mostly textures), so first load is slow. If you
 * want it snappier, re-export the model with smaller (≤1–2K) textures.
 */

// Pale, de-saturated tone — real roots are closer to cream/tan than dark soil.
const ROOT = '#cdb492';
const SOIL = '#43301f';

const ROSE_URL = '/red_rose.glb';
/** Height (world units) to scale the rose to — spans the old stem→flower range. */
const TARGET_HEIGHT = 6.5;
/** Where the rose's base sits — the soil line, where the roots begin. */
const BASE_Y = -2.5;

/** Deterministic PRNG so the root system is stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A tube that tapers from `rBase` to `rTip` along a curve — three.js'
 * `TubeGeometry` only does a constant radius, so we build it by hand to get
 * roots that thin out to a point like real ones.
 */
function taperedTube(
  points: THREE.Vector3[],
  rBase: number,
  rTip: number,
  tubular = 40,
  radial = 6
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubular, false);
  const positions: number[] = [];
  const indices: number[] = [];
  const P = new THREE.Vector3();

  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, P);
    // Ease the radius so it stays sturdy near the base and whips to a fine tip.
    const r = THREE.MathUtils.lerp(rBase, rTip, t * t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      positions.push(
        P.x + r * (cos * N.x + sin * B.x),
        P.y + r * (cos * N.y + sin * B.y),
        P.z + r * (cos * N.z + sin * B.z)
      );
    }
  }
  for (let i = 1; i <= tubular; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1);
      const b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j;
      const d = (radial + 1) * (i - 1) + j;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Plant({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(ROSE_URL);

  // Clone (so the cached GLTF isn't mutated) and auto-fit: scale to TARGET_HEIGHT,
  // centre on X/Z, and seat the base at BASE_Y regardless of the model's origin.
  const rose = useMemo(() => {
    const obj = scene.clone(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = TARGET_HEIGHT / (size.y || 1);
    obj.scale.setScalar(scale);
    obj.position.set(
      -center.x * scale,
      BASE_Y - box.min.y * scale,
      -center.z * scale
    );
    return obj;
  }, [scene]);

  const rootGeos = useMemo(() => {
    const rand = mulberry32(20240607);
    const top = -2.5; // soil line
    const geos: THREE.BufferGeometry[] = [];
    const MAIN = 9;

    for (let i = 0; i < MAIN; i++) {
      const ang = (i / MAIN) * Math.PI * 2 + (rand() - 0.5) * 0.6;
      const reach = 1.3 + rand() * 1.4; // horizontal spread
      const depth = 5.5 + rand() * 2.5; // how far below the soil it dives
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      const sway = (rand() - 0.5) * 0.8;

      const main = [
        new THREE.Vector3(0, top + 0.1, 0),
        new THREE.Vector3(dx * reach * 0.22, top - depth * 0.22, dz * reach * 0.22),
        new THREE.Vector3(
          dx * reach * 0.6 + sway,
          top - depth * 0.55,
          dz * reach * 0.6 + sway
        ),
        new THREE.Vector3(dx * reach * 0.95, top - depth * 0.82, dz * reach * 0.95),
        new THREE.Vector3(dx * reach * 1.1, top - depth, dz * reach * 1.1),
      ];
      const rBase = 0.07 + rand() * 0.035;
      geos.push(taperedTube(main, rBase, 0.006, 48, 7));

      // Finer secondary roots branching off the main one.
      const mainCurve = new THREE.CatmullRomCurve3(main);
      const branches = 1 + Math.floor(rand() * 3);
      for (let b = 0; b < branches; b++) {
        const tStart = 0.35 + rand() * 0.4;
        const start = mainCurve.getPointAt(tStart);
        const bAng = ang + (rand() - 0.5) * 1.6;
        const bReach = 0.5 + rand() * 0.9;
        const bDepth = 1.2 + rand() * 1.8;
        const bx = Math.cos(bAng);
        const bz = Math.sin(bAng);
        const branch = [
          start.clone(),
          new THREE.Vector3(
            start.x + bx * bReach * 0.5,
            start.y - bDepth * 0.55,
            start.z + bz * bReach * 0.5
          ),
          new THREE.Vector3(
            start.x + bx * bReach,
            start.y - bDepth,
            start.z + bz * bReach
          ),
        ];
        geos.push(taperedTube(branch, rBase * 0.45, 0.004, 28, 6));
      }
    }
    return geos;
  }, []);

  // Dispose generated root geometries on unmount (R3F handles the model).
  useMemo(() => () => {
    rootGeos.forEach((g) => g.dispose());
  }, [rootGeos]);

  useFrame((state) => {
    if (reducedMotion || !group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.6) * 0.025;
    group.current.rotation.y = Math.sin(t * 0.25) * 0.12;
  });

  return (
    <group ref={group}>
      {/* Rose model (stem + bloom) */}
      <primitive object={rose} />

      {/* Soil */}
      <mesh position={[0, -2.62, 0]}>
        <cylinderGeometry args={[1.5, 1.55, 0.22, 48]} />
        <meshStandardMaterial color={SOIL} roughness={1} />
      </mesh>

      {/* Roots */}
      {rootGeos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={ROOT} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload(ROSE_URL);
