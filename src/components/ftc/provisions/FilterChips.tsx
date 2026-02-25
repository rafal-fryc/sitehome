import { X } from "lucide-react";

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface Props {
  filters: FilterChip[];
  onDismiss: (key: string) => void;
  onClearAll: () => void;
}

export default function FilterChips({ filters, onDismiss, onClearAll }: Props) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-sm border border-rule bg-cream font-garamond"
        >
          {filter.value}
          <button
            onClick={() => onDismiss(filter.key)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-muted-foreground hover:text-foreground font-garamond underline transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
