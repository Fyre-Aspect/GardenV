'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowDown, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LandingProps {
  onStart: () => void;
}

// Days of the current week already completed (drives both the headline number
// and the filled streak dots so they never drift out of sync).
const SHOWCASE_STREAK = 5;

const features = [
  {
    emoji: '🔬',
    title: 'AI Plant Doctor',
    desc: 'Snap a photo and get an instant diagnosis with a treatment plan.',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
  },
  {
    emoji: '🔥',
    title: 'Daily Streaks',
    desc: 'Build consistent care habits and keep your streak alive.',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
  },
  {
    emoji: '⚡',
    title: 'Earn XP',
    desc: 'Level up your gardener profile with every task completed.',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconBg: 'bg-yellow-100',
  },
  {
    emoji: '🏆',
    title: 'Challenges',
    desc: 'Weekly plant quests and rare badges to unlock.',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
  },
];

const steps = [
  {
    emoji: '🌱',
    num: '1',
    title: 'Add your plants',
    desc: 'Photograph and catalog every plant in your collection.',
  },
  {
    emoji: '🤖',
    num: '2',
    title: 'Get AI care plans',
    desc: 'Personalised watering, feeding, and light schedules.',
  },
  {
    emoji: '🏆',
    num: '3',
    title: 'Track & level up',
    desc: 'Complete tasks, earn XP, and become a master gardener.',
  },
];

const testimonials = [
  {
    text: 'I finally stopped killing my houseplants! The AI scan feature is genuinely incredible.',
    name: 'Sarah M.',
    level: 12,
    emoji: '🌿',
  },
  {
    text: "My 7-day streak turned into 30 days. I'm completely obsessed with leveling up.",
    name: 'Jake T.',
    level: 8,
    emoji: '🌱',
  },
  {
    text: "The AI diagnosed my monstera's root rot before it was too late. Absolute game changer.",
    name: 'Priya K.',
    level: 15,
    emoji: '🪴',
  },
];

const stats = [
  { emoji: '🔥', value: '12-day', label: 'avg streak' },
  { emoji: '🌱', value: '50K+', label: 'plants tracked' },
  { emoji: '⭐', value: '4.9', label: 'app rating' },
  { emoji: '👩‍🌾', value: '30K+', label: 'gardeners' },
];

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Section that reveals its children with a stagger when scrolled into view. */
function Reveal({
  children,
  className,
  ...rest
}: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="text-xl font-black text-garden">GardenKeeper</span>
          </div>
          <Button variant="outline" size="sm" onClick={onStart}>
            Sign In
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-green-50 to-white px-6 pb-24 pt-16 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl"
        >
          {/* Mascot with floating decorations */}
          <motion.div variants={fadeUp} className="relative mb-10 inline-block">
            <div className="absolute inset-0 scale-150 rounded-full bg-green-300/30 blur-3xl" />
            {[
              { e: '🌸', cls: '-top-5 -left-5 text-3xl', d: 0.3 },
              { e: '🌿', cls: '-top-3 -right-7 text-2xl', d: 0.9 },
              { e: '✨', cls: '-bottom-5 -left-7 text-2xl', d: 1.4 },
              { e: '🌱', cls: '-bottom-3 -right-5 text-3xl', d: 0.6 },
            ].map((dec) => (
              <span
                key={dec.e}
                className={`absolute animate-float ${dec.cls}`}
                style={{ animationDelay: `${dec.d}s` }}
              >
                {dec.e}
              </span>
            ))}
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-200 shadow-2xl"
            >
              <span className="select-none text-7xl" role="img" aria-label="potted plant">
                🪴
              </span>
            </motion.div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-5 text-5xl font-black leading-tight tracking-tight text-gray-900 md:text-7xl"
          >
            Grow smarter.
            <br />
            <span className="text-garden">Not harder.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mb-10 max-w-lg text-xl leading-relaxed text-gray-500"
          >
            The AI garden companion that makes plant care as addictive as leveling up.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" onClick={onStart}>
              Get Started — It&apos;s Free 🌱
            </Button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 px-4 py-2 text-lg font-bold text-gray-500 transition-colors hover:text-gray-900"
            >
              See how it works <ArrowDown className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Stats pills */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm"
              >
                <span className="text-xl">{stat.emoji}</span>
                <div className="text-left">
                  <div className="text-sm font-black leading-none text-gray-900">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl">
            Everything your garden needs.
          </h2>
          <p className="text-lg text-gray-500">One app. All your plants. Zero guesswork.</p>
        </div>
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`${f.bg} border-2 ${f.border} cursor-default rounded-3xl p-5 shadow-sm`}
            >
              <div
                className={`${f.iconBg} mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm`}
              >
                {f.emoji}
              </div>
              <h3 className="mb-2 text-sm font-black text-gray-900 md:text-base">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500 md:text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </Reveal>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        className="bg-gradient-to-b from-green-50 to-emerald-50 px-6 py-20"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl">
              How it works
            </h2>
            <p className="text-lg text-gray-500">Up and growing in 3 simple steps.</p>
          </div>
          <Reveal className="grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-[65%] top-10 z-0 hidden h-0.5 w-[70%] bg-green-200 md:block" />
                )}
                <div className="relative z-10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-200 bg-white text-4xl shadow-lg">
                  {step.emoji}
                </div>
                <div className="mb-3 inline-block rounded-full bg-garden px-2.5 py-0.5 text-xs font-black text-white">
                  Step {step.num}
                </div>
                <h3 className="mb-2 text-xl font-black text-gray-900">{step.title}</h3>
                <p className="leading-relaxed text-gray-500">{step.desc}</p>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── STREAK SHOWCASE ── */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <motion.div variants={fadeUp}>
            <Card className="flex flex-col items-center gap-8 border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50 p-8 md:flex-row md:p-12">
              <div className="flex-shrink-0 text-center">
                <div className="text-8xl leading-none">🔥</div>
                <div className="mt-2 text-5xl font-black text-orange-500">
                  {SHOWCASE_STREAK}
                </div>
                <div className="text-sm font-bold uppercase tracking-wide text-orange-400">
                  Day Streak
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-3 text-3xl font-black text-gray-900">
                  Consistency grows champions.
                </h3>
                <p className="mb-6 text-lg leading-relaxed text-gray-500">
                  Miss a day and your streak resets. Hit a milestone and unlock rare plant
                  badges. GardenKeeper makes showing up every day feel incredible.
                </p>
                <div className="flex gap-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div
                      key={`streak-${i}`}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          i < SHOWCASE_STREAK
                            ? 'bg-orange-400 text-white'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {i < SHOWCASE_STREAK ? '✓' : '·'}
                      </div>
                      <span className="text-xs font-medium text-gray-400">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </Reveal>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-4xl font-black text-gray-900 md:text-5xl">
            Loved by gardeners.
          </h2>
          <Reveal className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <Card className="h-full p-6 transition-shadow hover:shadow-md">
                  <p className="mb-6 leading-relaxed text-gray-700">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">
                      {t.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-400">Level {t.level} Gardener</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-garden px-6 py-24 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-block animate-float text-7xl">🌱</div>
          <h2 className="mb-4 text-4xl font-black md:text-6xl">Ready to grow?</h2>
          <p className="mx-auto mb-10 max-w-md text-xl leading-relaxed text-green-200">
            Join 30,000+ gardeners building their green thumb — one day at a time.
          </p>
          <Button
            size="lg"
            onClick={onStart}
            className="border-green-200/60 bg-white text-garden hover:bg-white"
          >
            Start your garden today 🪴
          </Button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Leaf className="h-5 w-5 text-garden" />
          <span className="font-black text-gray-600">GardenKeeper</span>
        </div>
        <p>© 2026 GardenKeeper. Grow every day.</p>
      </footer>
    </div>
  );
}
