type TooltipProps = {
  x: number;
  y: number;
  name: string;
  topic: string;
  reportCount: number;
  summary: string;
};

export default function ReportsGraphTooltip({
  x,
  y,
  name,
  topic,
  reportCount,
  summary,
}: TooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-xs rounded bg-foreground text-background px-3 py-2 shadow-lg text-xs leading-snug font-garamond"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, calc(-100% - 12px))",
      }}
    >
      <div className="font-semibold mb-0.5">{name}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">
        {topic} · {reportCount} {reportCount === 1 ? "report" : "reports"}
      </div>
      {summary && <div className="line-clamp-3 opacity-90">{summary}</div>}
    </div>
  );
}
