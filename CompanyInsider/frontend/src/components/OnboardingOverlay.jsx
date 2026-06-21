import { useState } from "react";
import { Sparkles, Search, FileText, Scale, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { icon: Sparkles, title: "Welcome to CompanyInsider", body: "Research any public company — no finance background needed. Here's a 20-second tour." },
  { icon: Search, title: "Explore a company", body: "Search any company to instantly see its share price, key numbers, and a price chart. See a “?” next to a term? Tap it for an explanation." },
  { icon: FileText, title: "Briefing & risk signals", body: "Get an AI summary of the last 90 days, plus  warning signs — like company executives selling their own shares, or financial analysts lowering their ratings." },
  { icon: Scale, title: "Compare & get ideas", body: "Put two companies head-to-head, or use the Ideas tab to get AI-suggested companies to research based on your goals." },
  { icon: MessageCircle, title: "Ask the AI analyst", body: "Open the chat bubble on any company to ask questions — it reads the company's official reports and live market data." },
];

export default function OnboardingOverlay({ onFinish, goTo }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const Icon = step.icon;
  const last = i === STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl">
        <span className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-3"><Icon size={24} className="text-white" /></span>
        <h2 className="text-xl font-bold">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{step.body}</p>
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span key={idx} className={"h-1.5 rounded-full transition-all " + (idx === i ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20")} />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onFinish} className="text-sm text-blue-200/50 hover:text-white">Skip</button>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10"><ChevronLeft size={16} /> Back</button>
            )}
            <button onClick={() => (last ? (onFinish(), goTo("home")) : setI(i + 1))}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold">
              {last ? "Get started" : "Next"} {!last && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}