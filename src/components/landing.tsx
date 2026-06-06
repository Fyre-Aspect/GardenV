'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  Camera,
  Leaf,
  ScanLine,
  Sparkles,
  Sprout,
  Star,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlantAvatar } from '@/components/garden/plant-avatar';
import { SectionHeader } from '@/components/garden/section-header';
import { StatPill } from '@/components/garden/stat-pill';
import { StreakDots } from '@/components/garden/streak-dots';
import { fadeUp, inView, stagger } from '@/lib/motion';

interface LandingProps {
  onStart: () => void;
}

// Days completed this week — drives the headline number and the dots together.
const SHOWCASE_STREAK = 5;

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: ScanLine,
    title: 'AI Plant Doctor',
    desc: 'Photograph a plant and get an instant diagnosis with a clear treatment plan.',
  },
  {
    icon: Sparkles,
    title: 'Daily Streaks',
    desc: 'Build consistent care habits and keep your streak alive day after day.',
  },
  {
    icon: Zap,
    title: 'Earn XP',
    desc: 'Level up your gardener profile with every task you complete.',
  },
  {
    icon: Trophy,
    title: 'Challenges',
    desc: 'Weekly plant quests and badges to keep things interesting.',
  },
];

const steps: { icon: LucideIcon; num: string; title: string; desc: string }[] = [
  {
    icon: Camera,
    num: '1',
    title: 'Add your plants',
    desc: 'Photograph and catalog every plant in your collection.',
  },
  {
    icon: Sparkles,
    num: '2',
    title: 'Get AI care plans',
    desc: 'Personalised watering, feeding, and light schedules.',
  },
  {
    icon: Trophy,
    num: '3',
    title: 'Track & level up',
    desc: 'Complete tasks, earn XP, and grow your green thumb.',
  },
];

const testimonials = [
  {
    text: 'I finally stopped killing my houseplants. The AI scan caught problems I would never have spotted.',
    name: 'Sarah Mills',
    level: 12,
  },
  {
    text: 'My 7-day streak turned into 30. Checking in on my plants has genuinely become a daily habit.',
    name: 'Jake Turner',
    level: 8,
  },
  {
    text: "It diagnosed my monstera's root rot before it was too late. A real save.",
    name: 'Priya Kapoor',
    level: 15,
  },
];

const stats: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: Sparkles, value: '12-day', label: 'avg streak' },
  { icon: Sprout, value: '50K+', label: 'plants tracked' },
  { icon: Star, value: '4.9', label: 'app rating' },
  { icon: Users, value: '30K+', label: 'gardeners' },
];

/** Section whose children rise in once, on scroll. */
function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={stagger} {...inView} className={className}>
      {children}
    </motion.div>
  );
}

function HeroMascot() {
  const reduce = useReducedMotion();
  const dots = [
    { cls: '-top-3 -left-4 bg-reward/60', d: 0 },
    { cls: '-top-2 -right-5 bg-primary/40', d: 0.6 },
    { cls: '-bottom-3 -left-5 bg-primary/30', d: 1.2 },
    { cls: '-bottom-2 -right-4 bg-reward/50', d: 0.3 },
  ];
  return (
    <div className="relative mb-10 inline-block">
      <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 blur-3xl" />
      {dots.map((dot) => (
        <motion.span
          key={dot.cls}
          className={`absolute h-2.5 w-2.5 rounded-full ${dot.cls}`}
          animate={reduce ? undefined : { y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: dot.d }}
        />
      ))}
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-primary/10 bg-gradient-to-br from-accent to-secondary shadow-xl"
      >
        <Leaf className="h-12 w-12 text-primary" strokeWidth={1.75} />
      </motion.div>
    </div>
  );
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-lg font-black tracking-tight text-foreground">
              GardenKeeper
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onStart}>
            Sign in
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/60 to-background px-6 pb-24 pt-16 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-2xl"
        >
          <motion.div variants={fadeUp}>
            <HeroMascot />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-5 text-5xl font-black leading-[1.05] tracking-tight text-foreground md:text-6xl"
          >
            Grow smarter.
            <br />
            <span className="text-primary">Not harder.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mb-9 max-w-md text-lg leading-relaxed text-muted-foreground"
          >
            The calm, intelligent companion that makes caring for your real plants a habit
            worth keeping.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={onStart}>
              Get started — it&apos;s free
            </Button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              See how it works <ArrowDown className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-3"
          >
            {stats.map((stat) => (
              <StatPill
                key={stat.label}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeader
          align="center"
          title="Everything your garden needs"
          description="One app. All your plants. Zero guesswork."
        />
        <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card className="h-full border-border p-6 transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-black text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </Reveal>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-secondary/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            align="center"
            title="How it works"
            description="Up and growing in three simple steps."
          />
          <Reveal className="grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-[60%] top-8 z-0 hidden h-px w-[80%] bg-border md:block" />
                )}
                <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                  <step.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="mb-2 text-xs font-black uppercase tracking-wider text-primary">
                  Step {step.num}
                </div>
                <h3 className="mb-1.5 text-lg font-black text-foreground">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── STREAK SHOWCASE ── */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <motion.div variants={fadeUp} {...inView}>
          <Card className="flex flex-col items-center gap-8 border-border bg-reward-soft/50 p-8 md:flex-row md:p-12">
            <div className="flex shrink-0 flex-col items-center">
              <Sparkles className="h-14 w-14 text-reward" strokeWidth={1.75} />
              <div className="mt-2 text-4xl font-black text-reward-foreground">
                {SHOWCASE_STREAK}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-reward-foreground/70">
                Day streak
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-2xl font-black tracking-tight text-foreground">
                Consistency grows champions
              </h3>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                Miss a day and your streak resets. Hit a milestone and unlock new badges.
                GardenKeeper makes showing up every day feel rewarding.
              </p>
              <StreakDots filled={SHOWCASE_STREAK} />
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-secondary/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeader align="center" title="Loved by gardeners" />
          <Reveal className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <Card className="h-full border-border p-6">
                  <p className="mb-6 leading-relaxed text-foreground/80">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <PlantAvatar name={t.name} shape="round" className="h-10 w-10 text-sm" />
                    <div>
                      <div className="text-sm font-black text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Level {t.level} gardener
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-20">
        <motion.div variants={fadeUp} {...inView} className="mx-auto max-w-4xl">
          <Card className="overflow-hidden border-0 bg-primary px-6 py-16 text-center text-primary-foreground">
            <Sprout className="mx-auto mb-5 h-10 w-10" strokeWidth={1.75} />
            <h2 className="mb-3 text-3xl font-black tracking-tight md:text-4xl">
              Ready to grow?
            </h2>
            <p className="mx-auto mb-8 max-w-md leading-relaxed text-primary-foreground/80">
              Join 30,000+ gardeners building their green thumb, one day at a time.
            </p>
            <Button
              size="lg"
              onClick={onStart}
              className="bg-background text-primary shadow-none hover:bg-background/90"
            >
              Start your garden today
            </Button>
          </Card>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          <span className="font-black text-foreground">GardenKeeper</span>
        </div>
        <p>© 2026 GardenKeeper. Grow every day.</p>
      </footer>
    </div>
  );
}
