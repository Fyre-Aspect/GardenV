'use client';

import dynamic from 'next/dynamic';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlantLoader } from '@/components/garden/plant-loader';

interface LandingProps {
  onStart: () => void;
}

// The 3D scene is WebGL-only and must never render on the server, so it's
// loaded client-side with a calm fallback while three.js boots up.
const PlantScene = dynamic(() => import('@/components/plant-scene'), {
  ssr: false,
  loading: () => <SceneLoader />,
});

function SceneLoader() { 
  return ( 
    <div
      className="flex h-full w-full items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <PlantLoader label="Growing your garden" />
    </div>
  );
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-accent/50 via-background to-secondary/50">
      {/* Fixed nav, layered above the WebGL canvas. */}
      <nav className="pointer-events-none absolute inset-x-0 top-0 z-[60] px-6 py-4">
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border/70 bg-background/70 px-4 py-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 pl-1">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-lg font-black tracking-tight text-foreground">
              Kindred
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onStart}>
            Sign in
          </Button>
        </div>
      </nav>

      <PlantScene onStart={onStart} />
    </div>
  );
}