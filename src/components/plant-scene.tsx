'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { Plant } from '@/components/plant-3d';
import { Button } from '@/components/ui/button';

/**
 * The scroll-driven 3D landing. Four virtual pages take the camera on a journey
 * down the plant — flower (hook) → stem (what it is / the habit) → roots (why).
 * `ScrollControls` owns the scroll; the `<Scroll html>` layer carries the copy
 * and scrolls in lockstep with the camera.
 */

interface PlantSceneProps {
  onStart: () => void;
}

/** Drives the camera straight down the plant as the user scrolls. */
function CameraRig() {
  const scroll = useScroll();
  useFrame((state) => {
    const o = scroll.offset; // 0 (flower) → 1 (roots)
    const y = THREE.MathUtils.lerp(4.15, -5.2, o);
    // Ease out and back in a touch so the middle of the journey feels dimensional.
    const arc = Math.sin(o * Math.PI);
    state.camera.position.set(arc * 0.6, y, 8.6 - arc * 1.1);
    state.camera.lookAt(0, y, 0);
  });
  return null;
}

export default function PlantScene({ onStart }: PlantSceneProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <Canvas
      camera={{ position: [0, 4.15, 8.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <hemisphereLight args={['#ffffff', '#43301f', 0.6]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 9, 6]} intensity={1.15} />
      <directionalLight position={[-6, 2, -3]} intensity={0.35} />

      <ScrollControls pages={4} damping={0.28}>
        <CameraRig />
        <Plant reducedMotion={reduce} />

        <Scroll html>
          <SceneCopy onStart={onStart} />
        </Scroll>
      </ScrollControls>
    </Canvas>
  );
}

/** Card wrapper that's readable over the 3D and re-enables pointer events. */
function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-auto max-w-md rounded-3xl border border-border/70 bg-background/70 p-7 shadow-xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

const eyebrow =
  'mb-3 text-xs font-black uppercase tracking-[0.18em] text-primary';

function SceneCopy({ onStart }: PlantSceneProps) {
  return (
    // pointer-events-none lets wheel/touch fall through to the scroll surface;
    // Panels/buttons opt back in with pointer-events-auto.
    <div className="pointer-events-none w-screen">
      {/* ── PAGE 1 · FLOWER (the hook) ── */}
      <section className="flex h-screen w-screen items-end justify-center px-6 pb-20">
        <Panel className="text-center">
          <div className={eyebrow}>Garden V</div>
          <h1 className="mb-3 text-4xl font-black leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            Grow something
            <br />
            <span className="text-primary">you&apos;re proud of.</span>
          </h1>
          <p className="mx-auto mb-6 max-w-sm leading-relaxed text-muted-foreground">
            Start at the bloom. Scroll down and follow the whole story — leaf by
            leaf, all the way to the roots of why we built this.
          </p>
          <Button size="lg" onClick={onStart}>
            Start growing — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Panel>
      </section>

      {/* ── PAGE 2 · UPPER STEM (what it is) ── */}
      <section className="flex h-screen w-screen items-center justify-start px-6 sm:px-16">
        <Panel>
          <div className={eyebrow}>The platform</div>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-foreground">
            Every plant, in one calm place.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Add each plant you own, note its light and quirks, and let Garden V
            hold every watering and feeding schedule for you — so nothing wilts
            during a busy week.
          </p>
        </Panel>
      </section>

      {/* ── PAGE 3 · LOWER STEM (the habit) ── */}
      <section className="flex h-screen w-screen items-center justify-end px-6 text-right sm:px-16">
        <Panel>
          <div className={eyebrow}>The habit</div>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-foreground">
            A daily ritual that sticks.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Check off today&apos;s care, snap a photo when something looks off,
            earn a little XP, and keep your streak alive. Small wins that quietly
            add up to a thriving garden.
          </p>
        </Panel>
      </section>

      {/* ── PAGE 4 · ROOTS (why we built it) ── */}
      <section className="flex h-screen w-screen items-start justify-center px-6 pt-24">
        <Panel className="text-center">
          <div className={eyebrow}>The roots</div>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-foreground">
            Why we built Garden V
          </h2>
          <p className="mx-auto mb-6 max-w-sm leading-relaxed text-muted-foreground">
            Most plants don&apos;t die from neglect — they die from being
            forgotten. Garden V is the gentle, rewarding nudge we wished we had:
            rooted in routine, growing right alongside you.
          </p>
          <Button size="lg" onClick={onStart}>
            Start your garden
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Panel>
      </section>
    </div>
  );
}
