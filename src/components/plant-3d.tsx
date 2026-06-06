'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * The procedural plant: built entirely from three.js geometry — no model file.
 * It's laid out vertically so the page can scroll down it:
 *   flower (top, ~y +4) → stem + leaves (middle) → soil → roots (bottom, ~y -6).
 * The whole thing breathes with a slow sway unless reduced motion is requested.
 */

const STEM = '#2d5a27';
const LEAF = '#3c7233';
const PETAL = '#eab64c';
const PETAL_CORE = '#995713';
const ROOT = '#9a6b46';
const SOIL = '#43301f';

/** A simple leaf/petal outline (base at origin, tip up the +Y axis). */
function leafShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.34, 0.25, 0.3, 0.95, 0, 1.35);
  s.bezierCurveTo(-0.3, 0.95, -0.34, 0.25, 0, 0);
  return s;
}

const LEAVES = [
  { y: -0.4, side: 1, scale: 1.3, tilt: -0.2 },
  { y: 0.6, side: -1, scale: 1.15, tilt: -0.25 },
  { y: 1.7, side: 1, scale: 0.98, tilt: -0.3 },
  { y: 2.5, side: -1, scale: 0.82, tilt: -0.32 },
];

const PETAL_COUNT = 8;

export function Plant({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const group = useRef<THREE.Group>(null);

  const stemGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -2.6, 0),
      new THREE.Vector3(0.18, -1.2, 0.05),
      new THREE.Vector3(-0.14, 0.2, -0.05),
      new THREE.Vector3(0.12, 1.6, 0.05),
      new THREE.Vector3(0, 3.0, 0),
      new THREE.Vector3(0, 3.8, 0),
    ]);
    return new THREE.TubeGeometry(curve, 80, 0.09, 10, false);
  }, []);

  const leafGeo = useMemo(() => new THREE.ShapeGeometry(leafShape(), 24), []);

  const rootGeos = useMemo(() => {
    const specs: [number, number][] = [
      [0.05, -0.2],
      [0.9, 0.3],
      [-0.9, -0.3],
      [0.5, -0.7],
      [-0.5, 0.7],
    ];
    return specs.map(([dx, dz]) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -2.5, 0),
        new THREE.Vector3(dx * 0.5, -3.3, dz * 0.5),
        new THREE.Vector3(dx * 1.1, -4.2, dz * 1.0),
        new THREE.Vector3(dx * 1.5, -5.2, dz * 1.3),
        new THREE.Vector3(dx * 1.7, -6.0, dz * 1.5),
      ]);
      return new THREE.TubeGeometry(curve, 60, 0.055, 8, false);
    });
  }, []);

  // Dispose generated geometries on unmount (R3F handles materials/meshes).
  useMemo(() => () => {
    stemGeo.dispose();
    leafGeo.dispose();
    rootGeos.forEach((g) => g.dispose());
  }, [stemGeo, leafGeo, rootGeos]);

  useFrame((state) => {
    if (reducedMotion || !group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.6) * 0.025;
    group.current.rotation.y = Math.sin(t * 0.25) * 0.12;
  });

  return (
    <group ref={group}>
      {/* Stem */}
      <mesh geometry={stemGeo}>
        <meshStandardMaterial color={STEM} roughness={0.7} />
      </mesh>

      {/* Leaves */}
      {LEAVES.map((l, i) => (
        <mesh
          key={i}
          geometry={leafGeo}
          position={[l.side * 0.06, l.y, 0]}
          rotation={[l.tilt, l.side * 0.5, l.side * -0.7]}
          scale={l.scale}
        >
          <meshStandardMaterial color={LEAF} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Flower — petals radiate in a plane tilted up toward the viewer. */}
      <group position={[0, 4.15, 0]} rotation={[-0.45, 0, 0]}>
        {Array.from({ length: PETAL_COUNT }).map((_, i) => (
          <mesh
            key={i}
            geometry={leafGeo}
            rotation={[0, 0, (i / PETAL_COUNT) * Math.PI * 2]}
            scale={0.62}
          >
            <meshStandardMaterial color={PETAL} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshStandardMaterial color={PETAL_CORE} roughness={0.85} />
        </mesh>
      </group>

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
