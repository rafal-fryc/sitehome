import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceRow {
  key: string;
  cells: React.ReactNode[];
  expandedContent?: React.ReactNode;
}

interface Props {
  headers: string[];
  rows: ReferenceRow[];
  caption?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function ReferenceTable({
  headers,
  rows,
  caption,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const table = (
    <Table>
      {caption && (
        <caption className="mt-4 text-sm text-muted-foreground font-garamond">
          {caption}
        </caption>
      )}
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="w-8" />
          {headers.map((h) => (
            <TableHead
              key={h}
              className="text-xs uppercase tracking-wide-label text-muted-foreground"
            >
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const isExpanded = expandedRows.has(row.key);
          const isExpandable = !!row.expandedContent;

          return (
            <Fragment key={row.key}>
              <TableRow
                className={cn(
                  isExpandable && "cursor-pointer hover:bg-accent/20"
                )}
                onClick={() => isExpandable && toggleRow(row.key)}
              >
                <TableCell className="w-8 text-muted-foreground">
                  {isExpandable &&
                    (isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    ))}
                </TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell key={i} className="text-sm text-foreground">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
              {isExpanded && row.expandedContent && (
                <TableRow>
                  <TableCell
                    colSpan={headers.length + 1}
                    className="p-0"
                  >
                    <div className="p-4 bg-cream/50 border-t border-rule">
                      {row.expandedContent}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );

  if (!collapsible) return table;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="text-xs text-muted-foreground font-garamond flex items-center gap-1 hover:text-foreground transition-colors py-1">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {isOpen ? "Hide table" : "Show table"}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{table}</CollapsibleContent>
    </Collapsible>
  );
}
