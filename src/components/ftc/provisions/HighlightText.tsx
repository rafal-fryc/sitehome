interface Props {
  text: string;
  query?: string;
  className?: string;
}

/**
 * Escape regex special characters in user input to prevent
 * regex injection when building the split pattern.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function HighlightText({ text, query, className }: Props) {
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Split query into individual words for multi-word highlighting
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map(escapeRegex);

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build pattern matching any of the query terms
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark
            key={i}
            className="bg-gold-light/50 text-foreground px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
