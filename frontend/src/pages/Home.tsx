import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, Brain, BarChart3, Search, CheckCircle2,
  AlertTriangle, ArrowRight, Newspaper, Lock, Globe,
} from 'lucide-react';

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Search,
    title: 'Search or Paste',
    description: 'Find articles via NewsAPI or paste any headline and content directly into the analyzer.',
  },
  {
    step: '02',
    icon: Brain,
    title: 'NLP Preprocessing',
    description: 'Text is cleaned, stop-words removed, and lemmatized — converting raw input into ML-ready features.',
  },
  {
    step: '03',
    icon: Zap,
    title: 'ML Classification',
    description: 'A TF-IDF vectorizer feeds a trained classifier (Logistic Regression / SVM) to score the text.',
  },
  {
    step: '04',
    icon: BarChart3,
    title: 'Confidence Result',
    description: 'You receive a REAL / FAKE prediction alongside a confidence percentage and key signal words.',
  },
];

const FEATURES = [
  { icon: Globe,        title: 'Live NewsAPI',          desc: 'Search current headlines from thousands of sources worldwide.' },
  { icon: Brain,        title: 'NLP Pipeline',           desc: 'Tokenization, stop-word removal, and lemmatization before every prediction.' },
  { icon: Zap,          title: 'Instant Prediction',     desc: 'Results in under a second — no waiting, no refresh.' },
  { icon: BarChart3,    title: 'Confidence Score',        desc: 'Per-class probabilities and a visual meter, not just a label.' },
  { icon: Lock,         title: 'JWT Authentication',      desc: 'Secure user accounts — only you can see your history.' },
  { icon: Newspaper,    title: 'Prediction History',      desc: 'Every analysis is saved so you can review and filter later.' },
];

const STATS = [
  { value: '95%+',    label: 'Model Accuracy',       sub: 'on benchmark datasets' },
  { value: '3',       label: 'ML Algorithms',         sub: 'compared per training run' },
  { value: '5 000',   label: 'TF-IDF Features',       sub: 'unigrams & bigrams' },
  { value: '< 1 s',   label: 'Prediction Latency',    sub: 'end-to-end API call' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl" />
          <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full bg-primary-800/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              AI-Powered Fake News Detection
            </span>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Truth<span className="text-primary-400">Lens</span>
              <br />
              <span className="text-slate-300 text-4xl md:text-5xl font-bold">
                See Through the Noise
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              TruthLens uses{' '}
              <span className="text-white font-medium">Natural Language Processing</span> and{' '}
              <span className="text-white font-medium">Machine Learning</span> to help you evaluate
              whether a news article shows patterns consistent with real or fake news — in under a second.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link to="/analyze" className="btn-primary text-base px-6 py-3">
                <Search className="w-5 h-5" />
                Analyze News
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link to="/news" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-base border border-white/20 transition-all">
                <Newspaper className="w-5 h-5" />
                Explore Latest News
              </Link>
            </div>

            {/* Mini trust row */}
            <div className="flex flex-wrap justify-center gap-4 pt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Real-time NewsAPI
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> NLP Preprocessing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> ML Confidence Score
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Prediction History
              </span>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full text-slate-50 dark:text-slate-900 fill-current">
            <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, sub }) => (
              <div key={label} className="card p-6 text-center space-y-1">
                <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{value}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-800/40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">How TruthLens Works</h2>
            <p className="section-subtitle mt-2 max-w-xl mx-auto">
              Four clean steps from raw headline to ML-backed prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-900 dark:via-primary-600 dark:to-primary-900" aria-hidden />

            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="card p-6 text-center space-y-3 relative z-10">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-xs font-bold text-primary-400 tracking-widest">{step}</span>
                <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle mt-2">
              A complete pipeline — from live news fetching to explainable ML predictions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Example result preview ───────────────────────────── */}
      <section className="bg-white dark:bg-slate-800/40 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">What a Result Looks Like</h2>
            <p className="section-subtitle mt-2">
              Clear, transparent output — including confidence and key signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real example */}
            <div className="rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Model Prediction</p>
                  <p className="text-2xl font-extrabold text-green-700 dark:text-green-400">✓ LIKELY REAL</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Confidence</span>
                  <span className="font-bold text-green-600">94%</span>
                </div>
                <div className="h-3 rounded-full bg-green-100 dark:bg-green-900/30 overflow-hidden">
                  <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-green-400 to-green-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">"Scientists announce breakthrough in quantum computing research…"</p>
            </div>

            {/* Fake example */}
            <div className="rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Model Prediction</p>
                  <p className="text-2xl font-extrabold text-orange-700 dark:text-orange-400">⚠ POSSIBLY FAKE</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Confidence</span>
                  <span className="font-bold text-orange-600">87%</span>
                </div>
                <div className="h-3 rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
                  <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-orange-400 to-orange-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">"SHOCKING!!! Secret government program exposed — share before deleted!!!"</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-20 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-5">
          <h2 className="text-3xl md:text-4xl font-extrabold">Start Analyzing News Today</h2>
          <p className="text-primary-200 text-lg">
            Free to use. No credit card. Just paste a headline and see what the model thinks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/analyze" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors">
              <Search className="w-5 h-5" />
              Analyze Now
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-700 hover:bg-primary-600 border border-primary-500 font-semibold transition-colors">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              TruthLens
            </div>
            <p className="text-xs text-center">
              Built with React, FastAPI, Scikit-learn &amp; NewsAPI. For educational/portfolio use.
              <br />
              Predictions are ML-based and do <strong>not</strong> constitute factual verification.
            </p>
            <div className="flex gap-4 text-xs">
              <Link to="/news" className="hover:text-white transition-colors">News</Link>
              <Link to="/analyze" className="hover:text-white transition-colors">Analyze</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
