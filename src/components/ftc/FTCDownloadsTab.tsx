import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FTCDataPayload } from "@/types/ftc";

const VIOLATION_COLORS: Record<string, string> = {
  deceptive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  unfair: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  both: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function FTCDownloadsTab({ data }: { data: FTCDataPayload }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...data.cases].sort((a, b) => b.year - a.year);
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((c) => c.company_name.toLowerCase().includes(q));
  }, [data.cases, search]);

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Downloads</h2>
        <p className="text-muted-foreground mt-1">
          Download case JSON files for your own LLM analysis.{" "}
          <span className="font-medium">{data.total_cases}</span> cases available.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left font-medium px-4 py-3">Company</th>
              <th className="text-left font-medium px-4 py-3 w-20">Year</th>
              <th className="text-left font-medium px-4 py-3 w-28">Violation</th>
              <th className="text-center font-medium px-4 py-3 w-28">Provisions</th>
              <th className="text-right font-medium px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.company_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.year}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={VIOLATION_COLORS[c.violation_type] ?? ""}
                  >
                    {c.violation_type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {c.num_provisions}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`/data/ftc-files/${c.id}.json`}
                      download
                      title={`Download ${c.company_name} JSON`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No cases match "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
