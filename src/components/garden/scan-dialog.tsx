'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Leaf,
  RefreshCw,
  ScanLine,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGarden, SCAN_XP } from '@/components/garden-provider';
import { STATUS_META } from '@/lib/data';
import { scanPlant, type PlantScanResult } from '@/lib/plant-ai';
import { cn } from '@/lib/utils';

type Phase = 'camera' | 'analyzing' | 'result' | 'error';

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after a successful scan so the host can surface a notification. */
  onScanned?: (info: { name: string; message: string; xp: number }) => void;
}

const MAX_DIM = 800; // downscale captured frames before sending to the model

export function ScanDialog({ open, onOpenChange, onScanned }: ScanDialogProps) {
  const { addScannedPlant } = useGarden();
  const reduce = useReducedMotion();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('camera');
  const [cameraReady, setCameraReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PlantScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  // Reset on open; tear down the camera on close.
  useEffect(() => {
    if (open) {
      setPhase('camera');
      setPreviewUrl(null);
      setResult(null);
      setErrorMsg('');
    } else {
      stopCamera();
    }
  }, [open, stopCamera]);

  // Start the live camera while we're on the camera step.
  useEffect(() => {
    if (!open || phase !== 'camera') return;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraReady(false); // no camera API → upload fallback only
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch {
        setCameraReady(false); // permission denied / unavailable → upload fallback
      }
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, phase, stopCamera]);

  const analyze = useCallback(
    async (dataUrl: string) => {
      setPreviewUrl(dataUrl);
      setPhase('analyzing');
      stopCamera();
      try {
        const [meta, base64] = dataUrl.split(',');
        const mime = /data:(.*?);/.exec(meta)?.[1] ?? 'image/jpeg';
        const res = await scanPlant(base64, mime);

        if (!res.isPlant) {
          setErrorMsg(
            "I couldn't spot a plant in that photo. Try again with the plant filling the frame."
          );
          setPhase('error');
          return;
        }

        const plant = addScannedPlant({
          name: res.commonName,
          species: res.species,
          status: res.status,
          healthScore: Math.max(0, Math.min(100, Math.round(res.healthScore))),
          light: res.light,
          wateringIntervalDays: res.wateringIntervalDays,
          fertilizingIntervalDays: res.fertilizingIntervalDays,
        });

        setResult(res);
        setPhase('result');
        onScanned?.({ name: plant.name, message: res.summary, xp: SCAN_XP });
      } catch (err) {
        console.error('[scan] analysis failed', err);
        setErrorMsg(
          'The scan couldn’t finish. Check that you’re online and that Firebase AI Logic is enabled, then try again.'
        );
        setPhase('error');
      }
    },
    [addScannedPlant, onScanned, stopCamera]
  );

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    analyze(canvas.toDataURL('image/jpeg', 0.85));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => analyze(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = ''; // allow re-selecting the same file
  }

  function retry() {
    setErrorMsg('');
    setResult(null);
    setPreviewUrl(null);
    setPhase('camera');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan a plant
          </DialogTitle>
          <DialogDescription>
            {phase === 'camera' && 'Point your camera at a plant and capture a photo for an instant AI health check.'}
            {phase === 'analyzing' && 'Reading leaf colour, shape and health markers…'}
            {phase === 'result' && 'Here’s what the scan found.'}
            {phase === 'error' && 'Let’s try that again.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── CAMERA ── */}
        {phase === 'camera' && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-foreground/5">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <Camera className="h-8 w-8 text-primary/60" />
                  Camera unavailable or not allowed. You can upload a photo instead.
                </div>
              )}
              {cameraReady && <ScanFrame reduce={!!reduce} />}
            </div>

            <Button onClick={capture} disabled={!cameraReady} className="w-full">
              <Camera className="h-4 w-4" />
              Capture & scan
            </Button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload a photo instead
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onFile}
            />
          </div>
        )}

        {/* ── ANALYSING ── */}
        {phase === 'analyzing' && (
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-foreground/5">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[1px]" />
            <ScanFrame reduce={!!reduce} />
            <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 text-sm font-bold text-white drop-shadow">
              <Leaf className="h-4 w-4 animate-pulse" />
              Analysing your plant…
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && result && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={result.commonName}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-lg font-black leading-tight text-foreground">
                  {result.commonName}
                </div>
                <div className="truncate text-xs italic text-muted-foreground">
                  {result.species}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-black',
                      STATUS_META[result.status].tone
                    )}
                  >
                    {STATUS_META[result.status].label}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                    Health {Math.round(result.healthScore)}/100
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-foreground/80">{result.summary}</p>

            {result.issues.length > 0 && (
              <div className="rounded-2xl border border-border bg-secondary/40 p-3">
                <div className="mb-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  What I noticed
                </div>
                <ul className="space-y-1">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reward" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.careTips.length > 0 && (
              <div className="rounded-2xl border border-border bg-accent/40 p-3">
                <div className="mb-1.5 text-xs font-black uppercase tracking-wider text-primary">
                  Care tips
                </div>
                <ul className="space-y-1">
                  {result.careTips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-reward-soft px-3 py-1 text-xs font-black text-reward-foreground">
                <Sparkles className="h-3.5 w-3.5" />+{SCAN_XP} XP
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Added to your garden
              </span>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-reward-soft">
              <AlertTriangle className="h-7 w-7 text-reward" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{errorMsg}</p>
          </div>
        )}

        {phase !== 'analyzing' && (
          <DialogFooter className="mt-2">
            {phase === 'result' && (
              <Button variant="ghost" onClick={retry}>
                <RefreshCw className="h-4 w-4" />
                Scan another
              </Button>
            )}
            {phase === 'error' && (
              <Button variant="ghost" onClick={retry}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            )}
            <Button
              variant={phase === 'result' ? 'default' : 'outline'}
              onClick={() => onOpenChange(false)}
            >
              {phase === 'result' ? 'Done' : 'Close'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Reticle + sweeping scan line overlay. */
function ScanFrame({ reduce }: { reduce: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-6 rounded-2xl border-2 border-white/70" />
      {!reduce && (
        <motion.div
          className="absolute inset-x-6 h-0.5 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.7)]"
          initial={{ top: '12%' }}
          animate={{ top: ['12%', '88%', '12%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}
