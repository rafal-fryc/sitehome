import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import type { FTCCaseSummary } from "@/types/ftc";

interface Props {
  cases: FTCCaseSummary[];
}

type SortKey = "company_name" | "date_issued" | "violation_type" | "num_provisions";
type SortDir = "asc" | "desc";

function violationBadge(type: string) {
  switch (type) {
    case "deceptive":
      return <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Deceptive</Badge>;
    case "unfair":
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Unfair</Badge>;
    case "both":
      return <Badge className="bg-green-100 text-green-800 border-0 text-xs">Both</Badge>;
    default:
      return null;
  }
}

export default function FTCCaseTable({ cases }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date_issued");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...cases].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "company_name") cmp = a.company_name.localeCompare(b.company_name);
      else if (sortKey === "date_issued") cmp = a.date_issued.localeCompare(b.date_issued);
      else if (sortKey === "violation_type") cmp = a.violation_type.localeCompare(b.violation_type);
      else if (sortKey === "num_provisions") cmp = a.num_provisions - b.num_provisions;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [cases, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  }

  return (
    <div className="border border-rule overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("company_name")}
            >
              Company <SortIcon col="company_name" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("date_issued")}
            >
              Date <SortIcon col="date_issued" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("violation_type")}
            >
              Type <SortIcon col="violation_type" />
            </TableHead>
            <TableHead className="hidden md:table-cell">Categories</TableHead>
            <TableHead
              className="cursor-pointer select-none hidden md:table-cell"
              onClick={() => toggleSort("num_provisions")}
            >
              Provisions <SortIcon col="num_provisions" />
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => (
            <TableRow key={c.id} className="hover:bg-accent/20">
              <TableCell className="font-medium max-w-[200px] truncate">
                {c.company_name}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {c.date_issued}
              </TableCell>
              <TableCell>{violationBadge(c.violation_type)}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {c.categories.slice(0, 2).map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {cat}
                    </Badge>
                  ))}
                  {c.categories.length > 2 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{c.categories.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                {c.num_provisions}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                  >
                    <a
                      href={`/data/ftc-files/${c.id}.json`}
                      download
                      title="Download JSON"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  {c.ftc_url && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                    >
                      <a
                        href={c.ftc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on FTC.gov"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
