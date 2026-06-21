import { useState } from "react";
import { HelpCircle } from "lucide-react";

export default function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative ml-1.5 inline-flex">
      <button onClick={() => setShow((s) => !s)} className="text-blue-200/50 hover:text-cyan-300"><HelpCircle size={13} /></button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-900/95 p-2.5 text-[11px] font-normal normal-case leading-snug text-blue-100 shadow-xl backdrop-blur">
          {text}
        </span>
      )}
    </span>
  );
}