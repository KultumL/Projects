import { TrendingUp, FileText, Users, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

export default function Home({ onStart }) {
  const features = [
    { icon: TrendingUp, title: "Live snapshot", text: "Price, market cap, key ratios, and a price chart for any public company." },
    { icon: FileText, title: "AI briefing", text: "Get an AI summary of the past 90 days, plus real warning signs." },
    { icon: Users, title: "Competitors", text: "See who they compete with and which startups are catching up." },
    { icon: MessageCircle, title: "AI analyst", text: "Ask anything. It reads official company reports and live market data to answer." },
  ];
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-blue-200/70">
          <Sparkles size={14} className="text-cyan-300" /> Company research, for everyone
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
          Understand any public company in{" "}
          <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">30 seconds</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-blue-100/60">
          Filings, financials, competitors, and an AI analyst. No finance degree required.
        </p>
        <button onClick={onStart}
          className="group mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-3.5 text-base font-semibold shadow-lg shadow-blue-500/40 transition hover:shadow-xl hover:shadow-blue-500/60">
          Start exploring <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>
        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]">
                <span className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-blue-500/80 to-cyan-400/80 p-2"><Icon size={18} className="text-white" /></span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-blue-100/55">{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}