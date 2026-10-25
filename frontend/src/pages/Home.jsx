import { Link } from "react-router-dom";
import {
  BarChart3, Lock, Timer, QrCode, Link2, Gauge, ShieldCheck, Zap, ArrowRight, Pencil,
} from "lucide-react";
import FreeUrlShortener from "../components/url/FreeUrlShortener";
import Footer from "../components/common/Footer";

const features = [
  { icon: BarChart3, title: "Real analytics", description: "Clicks over time, countries, cities, browsers, devices and referrers — with CSV export." },
  { icon: Link2, title: "Custom aliases", description: "Pick a memorable slug like /summer-sale. We check availability as you type." },
  { icon: Lock, title: "Password protection", description: "Gate any link behind a password. Passwords are securely hashed — never stored in plain text." },
  { icon: Timer, title: "Expiry & click limits", description: "Let links expire on a date or after N clicks. Perfect for campaigns and one-time shares." },
  { icon: Pencil, title: "Edit anytime", description: "Change the destination, pause a link, or rotate its password without changing the short URL." },
  { icon: QrCode, title: "QR codes", description: "Download crisp PNG or SVG QR codes for print, packaging and slides." },
];

const steps = [
  { n: "1", title: "Paste your link", text: "Drop in any long URL — no account needed for your first three." },
  { n: "2", title: "Customize it", text: "Add an alias, password, expiry or click limit from the dashboard." },
  { n: "3", title: "Share & track", text: "Watch clicks roll in with live, per-link analytics." },
];

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute inset-0 grid-fade pointer-events-none" />

        <div className="relative max-w-3xl mx-auto w-full text-center px-4 pt-28 pb-16 sm:pt-36 sm:pb-24 space-y-8 animate-slide-up">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-100/80 dark:bg-accent-900/50 text-accent-700 dark:text-accent-200 border border-accent-200/70 dark:border-accent-800">
              <Zap className="w-3.5 h-3.5" /> Fast, private, trackable
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-[1.08] tracking-tight">
              Short links that <span className="text-gradient">actually tell you something</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
              nanoURL turns long links into clean, trackable ones. See who clicks, protect links with passwords,
              or set them to expire — all from one simple dashboard.
            </p>
          </div>

          <div className="card p-4 sm:p-5 text-left shadow-xl shadow-accent-600/10 dark:shadow-black/30 backdrop-blur">
            <FreeUrlShortener />
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Want unlimited links and analytics?{" "}
            <Link to="/register" className="text-accent-600 dark:text-accent-300 hover:underline font-medium">Create a free account</Link>
            {" "}or{" "}
            <Link to="/login" className="text-accent-600 dark:text-accent-300 hover:underline font-medium">sign in</Link>
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Everything you need to manage links</h2>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2">Powerful enough for marketers, simple enough for everyone.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card card-hover p-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-600 to-accent-400 flex items-center justify-center text-white shadow-md shadow-accent-500/25 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1.5">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto card p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-center mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="text-center sm:text-left">
                <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/60 text-accent-700 dark:text-accent-200 font-bold text-sm flex items-center justify-center mx-auto sm:mx-0 mb-3">{s.n}</div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0d2d80 0%,#0066bb 55%,#00aaff 100%)" }}>
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-white/90" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to take control of your links?</h2>
          <p className="text-sm sm:text-base text-white/80 mt-2 max-w-md mx-auto">Create a free account and get unlimited links, analytics, QR codes and more.</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent-700 font-semibold text-sm hover:bg-accent-50 transition-colors">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-colors border border-white/25">
              <Gauge className="w-4 h-4" /> Sign in
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
