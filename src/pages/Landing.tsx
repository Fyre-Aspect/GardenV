interface LandingProps {
  onStart: () => void;
}

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

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="text-xl font-black text-garden">GardenKeeper</span>
          </div>
          <button
            onClick={onStart}
            className="px-5 py-2 text-garden font-bold border-2 border-garden rounded-xl hover:bg-garden hover:text-white transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-b from-emerald-50 via-green-50 to-white pt-16 pb-24 px-6 text-center overflow-hidden">
        {/* Mascot with floating decorations */}
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-green-300/30 rounded-full blur-3xl scale-150" />
          <span
            className="absolute -top-5 -left-5 text-3xl animate-float"
            style={{ animationDelay: '0.3s' }}
          >
            🌸
          </span>
          <span
            className="absolute -top-3 -right-7 text-2xl animate-float"
            style={{ animationDelay: '0.9s' }}
          >
            🌿
          </span>
          <span
            className="absolute -bottom-5 -left-7 text-2xl animate-float"
            style={{ animationDelay: '1.4s' }}
          >
            ✨
          </span>
          <span
            className="absolute -bottom-3 -right-5 text-3xl animate-float"
            style={{ animationDelay: '0.6s' }}
          >
            🌱
          </span>
          <div className="relative w-36 h-36 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center shadow-2xl animate-float">
            <span className="text-7xl select-none" role="img" aria-label="potted plant">
              🪴
            </span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-5 leading-tight tracking-tight">
          Grow smarter.
          <br />
          <span className="text-garden">Not harder.</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
          The AI garden companion that makes plant care as addictive as leveling up.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-garden text-white text-lg font-black rounded-2xl border-b-4 border-green-900 shadow-lg hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
          >
            Get Started — It's Free 🌱
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-4 text-gray-500 font-bold text-lg hover:text-gray-900 transition-colors"
          >
            See how it works ↓
          </a>
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {[
            { emoji: '🔥', value: '12-day', label: 'avg streak' },
            { emoji: '🌱', value: '50K+', label: 'plants tracked' },
            { emoji: '⭐', value: '4.9', label: 'app rating' },
            { emoji: '👩‍🌾', value: '30K+', label: 'gardeners' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100"
            >
              <span className="text-xl">{stat.emoji}</span>
              <div className="text-left">
                <div className="font-black text-gray-900 text-sm leading-none">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Everything your garden needs.
          </h2>
          <p className="text-lg text-gray-500">One app. All your plants. Zero guesswork.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} border-2 ${f.border} rounded-3xl p-5 hover:scale-105 hover:shadow-lg transition-all cursor-default`}
            >
              <div
                className={`${f.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm`}
              >
                {f.emoji}
              </div>
              <h3 className="font-black text-gray-900 mb-2 text-sm md:text-base">{f.title}</h3>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-gradient-to-b from-green-50 to-emerald-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-500">Up and growing in 3 simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[65%] w-[70%] h-0.5 bg-green-200 z-0" />
                )}
                <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg border-2 border-green-200 mx-auto mb-4">
                  {step.emoji}
                </div>
                <div className="inline-block bg-garden text-white text-xs font-black px-2.5 py-0.5 rounded-full mb-3">
                  Step {step.num}
                </div>
                <h3 className="font-black text-gray-900 text-xl mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STREAK SHOWCASE ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-100 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="text-center flex-shrink-0">
            <div className="text-8xl leading-none">🔥</div>
            <div className="text-5xl font-black text-orange-500 mt-2">7</div>
            <div className="text-sm font-bold text-orange-400 uppercase tracking-wide">Day Streak</div>
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-black text-gray-900 mb-3">
              Consistency grows champions.
            </h3>
            <p className="text-gray-500 text-lg mb-6 leading-relaxed">
              Miss a day and your streak resets. Hit a milestone and unlock rare plant badges.
              GardenKeeper makes showing up every day feel incredible.
            </p>
            <div className="flex gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={`streak-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i < 5 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {i < 5 ? '✓' : '·'}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center text-gray-900 mb-14">
            Loved by gardeners.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <p className="text-gray-700 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                    {t.emoji}
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">Level {t.level} Gardener</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-garden text-white py-24 px-6 text-center">
        <div className="text-7xl mb-6 animate-float inline-block">🌱</div>
        <h2 className="text-4xl md:text-6xl font-black mb-4">Ready to grow?</h2>
        <p className="text-green-200 text-xl mb-10 max-w-md mx-auto leading-relaxed">
          Join 30,000+ gardeners building their green thumb — one day at a time.
        </p>
        <button
          onClick={onStart}
          className="px-10 py-5 bg-white text-garden text-xl font-black rounded-2xl border-b-4 border-green-200/60 shadow-xl hover:brightness-105 active:border-b-0 active:translate-y-1 transition-all"
        >
          Start your garden today 🪴
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 text-center text-gray-400 text-sm border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🌿</span>
          <span className="font-black text-gray-600">GardenKeeper</span>
        </div>
        <p>© 2025 GardenKeeper. Grow every day.</p>
      </footer>
    </div>
  );
}
