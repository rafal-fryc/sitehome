import { Shield, Scale, AlertTriangle, Calendar } from "lucide-react";
import type { FTCDataPayload } from "@/types/ftc";

interface Props {
  data: FTCDataPayload;
}

export default function FTCOverviewStats({ data }: Props) {
  const { cases, total_cases } = data;

  const deceptive = cases.filter((c) => c.violation_type === "deceptive").length;
  const unfair = cases.filter((c) => c.violation_type === "unfair").length;
  const both = cases.filter((c) => c.violation_type === "both").length;

  const years = cases.map((c) => c.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const stats = [
    {
      label: "Total Cases",
      value: total_cases,
      icon: Shield,
    },
    {
      label: "Date Range",
      value: `${minYear}–${maxYear}`,
      icon: Calendar,
    },
    {
      label: "Deceptive",
      value: deceptive,
      icon: AlertTriangle,
    },
    {
      label: "Unfair",
      value: unfair,
      icon: Scale,
    },
    {
      label: "Both",
      value: both,
      icon: Shield,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="p-4 bg-cream border border-rule text-center"
        >
          <p className="text-xs uppercase tracking-wide-label text-muted-foreground mb-2">{s.label}</p>
          <p className="text-2xl font-bold text-primary">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
