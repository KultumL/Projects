export default function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-300"><Icon size={18} /></span>
        <div>
          <h4 className="font-semibold text-white">{title}</h4>
          {subtitle && <p className="text-xs text-blue-200/50">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}