import { Card } from "@/components/ui/card";
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
      color: "text-primary",
    },
    {
      label: "Date Range",
      value: `${minYear}–${maxYear}`,
      icon: Calendar,
      color: "text-gold",
    },
    {
      label: "Deceptive",
      value: deceptive,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      label: "Unfair",
      value: unfair,
      icon: Scale,
      color: "text-red-600",
    },
    {
      label: "Both",
      value: both,
      icon: Shield,
      color: "text-primary-light",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="p-4 bg-gradient-to-br from-card to-accent/30 border-0 shadow-soft text-center"
        >
          <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
          <p className="text-2xl font-bold text-foreground">{s.value}</p>
          <p className="text-sm text-muted-foreground">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
